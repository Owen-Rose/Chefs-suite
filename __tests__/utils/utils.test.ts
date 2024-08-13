import { exec } from "child_process";
import { capitalizeFirstLetter } from "@/utils/utils";

describe("capitalizeFirstLetter", () => {
  it("capitalizes the first letter of a string", () => {
    expect(capitalizeFirstLetter("hello")).toBe("Hello");
    expect(capitalizeFirstLetter("WORLD")).toBe("World");
    expect(capitalizeFirstLetter("openAI")).toBe("Openai");
  });

  it("returns an empty string if given an empty string", () => {
    expect(capitalizeFirstLetter("")).toBe("");
  });
});
