import React, { useState } from "react";
import "./App.css";
import { gql, useApolloClient } from "@apollo/client";

function App() {
  const client = useApolloClient();

  const [performAdjustments, setPerformAdjustments] = useState<boolean>();
  const [queriedInformation, setQueriedInformation] = useState<{
    isoDateReturnedFromQuery: string;
    serverOffsetMinutes: number;
    dateCreatedFromQueryResult: Date;
  }>();

  const [submissionInformation, setSubmissionInformation] = useState<{
    dateObjectSelectedFromDatePicker: Date;
    dateToSubmitToApi: Date;
    isoStringSubmittedInMutation: string;
    serverLocalString: string;
  }>();

  const fetchDate = (adjustTime: boolean) => {
    client
      .query<{ record: { date: Date; serverOffsetMinutes: number } }>({
        query: gql`
          query {
            record {
              date
              serverOffsetMinutes
            }
          }
        `,
        fetchPolicy: "no-cache",
      })
      .then((value) => {
        // The record date we receive is defined in the schema as DateTime scalar, and
        // TypeScript believes it is a Date object, but really it is a string so
        // we will need to explicitly tell Typescript that it is indeed a string.
        console.log(typeof value.data.record.date);
        const isoDate = value.data.record.date as unknown as string;
        console.log({
          raw: new Date(isoDate).toLocaleString(),
          adjusted:
            parseDateAndCreateMatchingJavascriptDate(isoDate).toLocaleString(),
        });

        const localDateObject = adjustTime
          ? parseDateAndCreateMatchingJavascriptDate(isoDate)
          : new Date(isoDate);

        setQueriedInformation({
          isoDateReturnedFromQuery: isoDate,
          serverOffsetMinutes: value.data.record.serverOffsetMinutes,
          dateCreatedFromQueryResult: localDateObject,
        });
      });
  };

  const updateDate = (adjustTime: boolean) => () => {
    setPerformAdjustments(adjustTime);

    const dateObjectSelectedFromDatePicker = new Date();
    const dateToSubmitToApi = adjustTime
      ? adjustDateToSendToApi(dateObjectSelectedFromDatePicker)
      : dateObjectSelectedFromDatePicker;

    const isoStringToSubmit = dateToSubmitToApi.toJSON();

    client
      .mutate<
        { updateRecord: { scalarResult: Date; serverLocalString: string } },
        { date: Date }
      >({
        mutation: gql`
        mutation {
          updateRecord(date: "${isoStringToSubmit}") {
            scalarResult
            serverLocalString
          }
        }
      `,
        fetchPolicy: "no-cache",
      })
      .then((value) => {
        if (!!value.data) {
          setSubmissionInformation({
            dateObjectSelectedFromDatePicker,
            dateToSubmitToApi,
            isoStringSubmittedInMutation: isoStringToSubmit,
            serverLocalString: value.data.updateRecord.serverLocalString,
          });
        }
      })
      .finally(() => {
        fetchDate(adjustTime);
      });
  };

  const adjustDateToSendToApi = (date: Date) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  };

  const parseDateAndCreateMatchingJavascriptDate = (dateString: string) => {
    const result = new Date(dateString);
    result.setMinutes(result.getMinutes() + result.getTimezoneOffset());
    return result;
  };

  return (
    <div className="App">
      {!!queriedInformation && (
        <div>
          <table>
            <tbody>
              <tr>
                <th>Local Timezone Offset Minutes</th>
                <td>{new Date().getTimezoneOffset()}</td>
                <td></td>
              </tr>
              <tr>
                <th>Server Timezone Offset Minutes</th>
                <td>{queriedInformation.serverOffsetMinutes}</td>
                <td></td>
              </tr>
              {!!submissionInformation && (
                <>
                  <tr>
                    <th>Step 1: Date object selected (ex. from DatePicker)</th>
                    <td>
                      {submissionInformation.dateObjectSelectedFromDatePicker.toLocaleString()}
                    </td>
                    <td>
                      This represents the Javascript Date object selected from
                      your date picker tool and which will be used to submit
                      update information to the API. It will be in your
                      browser's local time (i.e. reflecting your local offset)
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Step 2: {performAdjustments && "Adjust"} Date object for
                      mutation {!performAdjustments && "(unadjusted)"}
                    </th>
                    <td>
                      {submissionInformation.dateToSubmitToApi.toLocaleString()}
                    </td>
                    <td>
                      This represents the{" "}
                      <i>{performAdjustments ? "adjusted" : "unadjusted"}</i>
                      Javascript Date object before it is converted to an ISO
                      formatted string to submit to the API.
                      <p
                        style={{ color: performAdjustments ? "green" : "red" }}
                      >
                        Note how the date/time{" "}
                        <i>{performAdjustments ? "differs from" : "matches"}</i>{" "}
                        the date/time selected from the date picker.
                      </p>
                      {performAdjustments && (
                        <p>
                          It has been adjusted according to the local time's
                          offset so that when an ISO string is created, then
                          that string will have the same year, month, day,
                          hours, minutes, and seconds as the original selected
                          date has when displayed in local time.
                        </p>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Step 3: Convert Date to ISO String and submit</th>
                    <td>
                      {submissionInformation.isoStringSubmittedInMutation}
                    </td>
                    <td>
                      This value is the ISO formatted string that will be
                      supplied to the API. Obtained by calling{" "}
                      <code>toISOString()</code> or <code>toJSON()</code> on the
                      Date object. This is exactly what your API will receive
                      and will use to create it's local date object.
                      <p
                        style={{ color: performAdjustments ? "green" : "red" }}
                      >
                        Note how the date/time{" "}
                        <i>{performAdjustments ? "matches" : "differs from"}</i>{" "}
                        the date/time selected from the date picker.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Step 4: Server local date parsed at server by scalar
                    </th>
                    <td>{submissionInformation.serverLocalString}</td>
                    <td>
                      This is the date that results on the server when the API
                      receives the ISO string and uses a scalar to parse it in
                      to a local JavaScript Date object. The resulting Date
                      object will be in the server's local time and reflect the
                      server's offset (commonly 0 offset because many servers
                      use UTC time).
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <th>Step 5: Query the date from the API</th>
                <td>{queriedInformation.isoDateReturnedFromQuery}</td>
                <td>
                  This is the ISO string returned from the server when you
                  request the date. It matches exactly what was sent in Step 3.
                </td>
              </tr>
              <tr>
                <th>
                  Step 6: {performAdjustments && "Adjusted"} Javascript Date
                  From ISO String {!performAdjustments && "(unadjusted)"}
                </th>
                <td>
                  {queriedInformation.dateCreatedFromQueryResult.toLocaleString()}
                </td>
                <td>
                  This is the final step where you create a new JavaScript Date
                  object from the ISO string received in Step 5. You then use
                  this date to set the value of your date picker tool.
                  <p style={{ color: performAdjustments ? "green" : "red" }}>
                    Note that the date and time here{" "}
                    <i>{performAdjustments ? "matches" : "differs from"}</i> the
                    ISO string we received from the server. This means that what
                    you see in your browser will be{" "}
                    {performAdjustments ? "the same" : "different"} than what
                    somebody in a different time zone will see.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={updateDate(false)} style={{ marginRight: "1rem" }}>
          Update Date (Without Adjustments)
        </button>
        <button onClick={updateDate(true)} style={{ marginRight: "1rem" }}>
          Update Date (With Adjustments)
        </button>
      </div>
    </div>
  );
}

export default App;
