import { describe, it, expect } from "vitest";
import { parseListingTitle } from "@/lib/parser/listing-parser";

describe("parseListingTitle", () => {
  it("parses a standard issue with hash number", () => {
    const result = parseListingTitle("Amazing Spider-Man #129 VF+ 1974 Marvel");
    expect(result.seriesName).toBe("Amazing Spider-Man");
    expect(result.issueNumber).toBe("129");
    expect(result.gradingCompany).toBeNull();
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("parses CGC graded comics", () => {
    const result = parseListingTitle(
      "Amazing Spider-Man #300 CGC 9.4 White Pages 1st Venom"
    );
    expect(result.seriesName).toBe("Amazing Spider-Man");
    expect(result.issueNumber).toBe("300");
    expect(result.gradingCompany).toBe("CGC");
    expect(result.grade).toBe(9.4);
    expect(result.keywords).toEqual(
      expect.arrayContaining([expect.stringMatching(/white pages/i)])
    );
  });

  it("parses CBCS graded comics", () => {
    const result = parseListingTitle(
      "THE AMAZING SPIDER-MAN 361 CBCS 9.8 FIRST CARNAGE"
    );
    expect(result.gradingCompany).toBe("CBCS");
    expect(result.grade).toBe(9.8);
  });

  it("detects newsstand variants", () => {
    const result = parseListingTitle(
      "X-Men #141 Newsstand VF+ Days of Future Past Marvel 1981"
    );
    expect(result.isVariant).toBe(true);
    expect(result.variant).toMatch(/newsstand/i);
    expect(result.issueNumber).toBe("141");
  });

  it("detects reprints/facsimiles", () => {
    const result = parseListingTitle(
      "Amazing Fantasy #15 Facsimile Edition 2019 Marvel"
    );
    expect(result.isReprint).toBe(true);
  });

  it("handles No. prefix for issue number", () => {
    const result = parseListingTitle("Action Comics No. 1 Reprint DC");
    expect(result.issueNumber).toBe("1");
    expect(result.isReprint).toBe(true);
  });

  it("extracts first appearance keywords", () => {
    const result = parseListingTitle(
      "Incredible Hulk #181 1st appearance Wolverine Marvel 1974"
    );
    expect(result.keywords).toEqual(
      expect.arrayContaining([expect.stringMatching(/1st appearance/i)])
    );
  });

  it("handles comics with year in parentheses", () => {
    const result = parseListingTitle("BATMAN #1 (2016) DC Comics NM 9.4 Tom King Rebirth");
    expect(result.issueNumber).toBe("1");
    expect(result.seriesName).toMatch(/batman/i);
  });

  it("returns low confidence for unparseable titles", () => {
    const result = parseListingTitle("Lot of misc comics vintage collection");
    expect(result.confidence).toBeLessThan(0.3);
  });

  it("handles issue numbers without hash sign", () => {
    const result = parseListingTitle(
      "X-Men 141 Newsstand VF+ Days of Future Past"
    );
    expect(result.issueNumber).not.toBeNull();
  });
});
