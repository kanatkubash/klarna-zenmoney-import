import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import { query } from "./request.graphql";
import fetch from "node-fetch";
import { TransactionResponse } from "./TransactionResponse";

const url = "https://app.klarna.com/se/api/orders_bff/transactions/graphql";
const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZiMTlkZTJhLTliMWQtNGJhNS1iZGNiLTdiOGE1NWYwMGRkNyJ9.eyJpc3MiOiJodHRwczovL2FwcC5rbGFybmEuY29tIiwicGVyc29uYV9pZCI6IjVjYzJiYTEyLTgwZGItNGYwYi05ZTQ2LTU5ZDc3YjExZWM1MyIsInBlcnNvbmFfa3JuIjoia3JuOnVzZXItYWNjb3VudC1ldTpwZXJzb25hOjVjYzJiYTEyLTgwZGItNGYwYi05ZTQ2LTU5ZDc3YjExZWM1MyIsImdyYW50VHlwZSI6ImJhbmtJZFNlIiwibWFya2V0IjoiU0UiLCJ6b25lIjozLCJzY29wZSI6ImRlZmF1bHQiLCJqdGkiOiI0OTQzOWNiYy02ZDRiLTQzMzItYWU0NS0wYTQ5NTI5MGRjMjMiLCJpYXQiOjE2MzcxODg1MDIsImV4cCI6MTYzNzE4OTEwMiwiYXVkIjoiYWNjZXNzIn0.SL3kLTHF1o--VYuAucivEN4DGyh-7iSYXAMYwfbGUoPV0nPHrpipIsIpzVquTIuimyof-amllYFZJMhm9mpU5TFlPwjsaEMSvY-aCgE7mYs1fXfSgNj4n-66InLqH3v1w5vWFy7_cclioRt03QxEVvrl6b1nIuuBQlJlXN1fy6NHigXi6iBUAaRTx4-yPy6fIEq_tURlISxZjsbNP_Vjj1SSBAsjMwqpBbGRWYgIvhePpR2Vl6X2Dx4x6Ip5auYv-viKQXgxi-o4S-lrS0zXkv4pCg8biYqLA1W5c6sPcAotL1RzBRLsenAv-L9VRsstT3hTMBwzJ8yYwiIe_aUkjA";
const client = new ApolloClient({
  //   uri: url,
  link: new HttpLink({ uri: url, fetch: fetch as any }),
  cache: new InMemoryCache(),
});
(async () => {
  var { data } = await client.query<TransactionResponse>({
    query,
    variables: {
      page: {
        limit: 10,
        token: 0,
      },
      filter: "internal",
      filterData: {},
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  console.log(data.enrichedTransactionList.page);
})();
