export type uuid = string;

function setCharAt(str: string, index: number, chr: string) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

export const ensureUuid = (uuidLike: string): uuid => {
  uuidLike = uuidLike.toLocaleLowerCase();
  if (uuidLike.length != 32 && uuidLike.length != 36)
    throw new Error(`${uuidLike} not a UUID like string`);
  if (!uuidLike.match(/(\w{8})-(\w{4})-(\w{4})-(\w{4})-(\w{12})/))
    uuidLike = uuidLike.replace(
      /(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/g,
      "$1-$2-$3-$4-$5"
    );

  uuidLike = setCharAt(uuidLike, 14, "4");
  var possible19ByteValues = ["8", "9", "a", "b"];
  if (!possible19ByteValues.includes(uuidLike[19])) {
    var randomIndex = Math.floor(Math.random() * possible19ByteValues.length);
    uuidLike = setCharAt(uuidLike, 19, possible19ByteValues[randomIndex]);
  }

  return uuidLike;
};

export const newUuid = () => {
  var randomHex = Buffer.from(
    new Uint8Array(16).map(() => Math.floor(Math.random() * 256))
  ).toString("hex");
  return ensureUuid(randomHex);
};
