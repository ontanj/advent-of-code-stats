import { get as httpsGet, RequestOptions, request } from "https";

export const get = (url: string, options?: RequestOptions) =>
  new Promise<LeaderboardData>((resolve) =>
    httpsGet(url, options ?? {}, (res) => {
      let body = "";
      res.on("data", (data) => {
        body += data;
      });
      res.on("end", () => {
        resolve(JSON.parse(body));
      });
    })
  );

export const post = (
  url: string,
  body: string,
  options?: Exclude<RequestOptions, "method">
) =>
  new Promise<PostResponse>((resolve, reject) => {
    const q = request(
      url,
      {
        method: "POST",
        ...options,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (d) => {
          responseBody += d;
        });
        res.on("end", () => {
          if (res.statusCode)
            resolve({ status: res.statusCode, body: responseBody });
          else reject(new Error("No status code"));
        });
      }
    );
    q.write(body);
    q.end();
  });

interface PostResponse {
  status: number;
  body: string;
}
