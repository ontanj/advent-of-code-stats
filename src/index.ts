import { createWriteStream, readFileSync } from "fs";
import { get, post } from "./api";
import { latestFileName, saveDataFile } from "./fs";
import { join as joinPath } from "node:path";

const dataFolder = "data";

main();

async function main() {
  const config = getConfig();
  const data = await get(
    `https://adventofcode.com/2022/leaderboard/private/view/${config.boardId}.json`,
    {
      headers: { Cookie: `session=${config.sessionId}` },
    }
  );

  const latestDataFile = latestFileName(config.dataPath);
  if (latestDataFile) {
    const latest: LeaderboardData = JSON.parse(
      readFileSync(joinPath(config.dataPath, latestDataFile)).toString()
    );
    const stats = listUpdates(data, latest);
    sendToSlack(stats, config);
  }
  saveDataFile(data, config.dataPath);
}

function getConfig(): Config {
  if (
    process.env["AOC_PATH"] &&
    process.env["BOARD"] &&
    process.env["SLACK_HOOK"] &&
    process.env["SESSIONID"]
  ) {
    return {
      dataPath: joinPath(
        process.env["AOC_PATH"],
        dataFolder,
        process.env["BOARD"]
      ),
      boardId: process.env["BOARD"],
      basePath: process.env["AOC_PATH"],
      slackHook: process.env["SLACK_HOOK"],
      sessionId: process.env["SESSIONID"],
    };
  } else throw new Error("Missing configuration");
}

function sendToSlack(
  stats: Update[],
  config: Pick<Config, "basePath" | "slackHook">
) {
  const stream = createWriteStream(joinPath(config.basePath, "log.txt"), {
    flags: "a",
  });

  Promise.allSettled(
    stats.map(async (stat) => {
      const text = message(stat);
      if (text) {
        const body = JSON.stringify({ text });
        const res = await post(config.slackHook, body, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        stream.write(
          `${new Date().toISOString()}: ${stat.name}, ${res.status} ${body}\n`
        );

        return res;
      }
    })
  ).finally(() => {
    stream.close();
  });
}

function getTime(epoch: number) {
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(epoch * 1000);
}

function message(stat: Update) {
  const t1 = stat.parts.find((p) => p.part === 1)?.time;
  const t2 = stat.parts.find((p) => p.part === 2)?.time;
  if (t1 && t2) {
    return `${stat.name} har klarat båda dagens uppgifter, klockan ${getTime(
      t1
    )} och ${getTime(t2)}. Bra jobbat! 🌟`;
  } else if (t2) {
    return `${stat.name} har klarat dagens andra uppgift, klockan ${getTime(
      t2
    )}. Bra jobbat! ⭐`;
  } else if (t1) {
    return `${stat.name} har klarat dagens första uppgift, klockan ${getTime(
      t1
    )}. Bra jobbat! 🥈`;
  }
}

function listUpdates(
  latestData: LeaderboardData,
  previousData: LeaderboardData
) {
  return Object.entries(latestData.members).reduce<Update[]>(
    (updates, [member, memberData]) => {
      const latestMemberData = previousData.members[member];
      if (memberData.last_star_ts !== latestMemberData?.last_star_ts) {
        const today = new Date().getDate();
        const latestDayData = memberData.completion_day_level[today];
        const previousDayData = latestMemberData?.completion_day_level[today];
        if (latestDayData)
          if (
            latestDayData[1] &&
            latestDayData[2] &&
            !previousDayData?.[1] &&
            !previousDayData?.[2]
          ) {
            // both parts were solved since last time
            return [
              ...updates,
              {
                name: memberData.name,
                parts: [
                  { part: 1, time: latestDayData[1].get_star_ts },
                  { part: 2, time: latestDayData[2].get_star_ts },
                ],
              },
            ];
          } else if (latestDayData[2] && !previousDayData?.[2]) {
            // only second part was solved since last time
            return [
              ...updates,
              {
                name: memberData.name,
                parts: [{ part: 2, time: latestDayData[2].get_star_ts }],
              },
            ];
          } else if (latestDayData[1] && !previousDayData?.[1]) {
            // only first part was solved since last time
            return [
              ...updates,
              {
                name: memberData.name,
                parts: [{ part: 1, time: latestDayData[1].get_star_ts }],
              },
            ];
          }
      }
      return updates;
    },
    []
  );
}
