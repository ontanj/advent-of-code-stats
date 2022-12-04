import { readdirSync, writeFileSync } from "fs";

export const latestFileName = (dataPath: string) => {
  const d = readdirSync(dataPath);
  const l = d
    .map((name) => name.match(/^(\d+).json$/)?.[1])
    .filter<string>((a): a is NonNullable<typeof a> => !!a)
    .map((n) => parseInt(n))
    .reduce((latest, v) => (v > latest ? v : latest), 0);
  if (l === 0) return;
  return `${l}.json`;
};

export const saveDataFile = (data: LeaderboardData, dataPath: string) => {
  writeFileSync(
    `${dataPath}/${Math.floor(new Date().getTime() / 1000)}.json`,
    JSON.stringify(data, undefined, 2)
  );
};
