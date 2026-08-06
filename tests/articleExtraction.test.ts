/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  estimateListeningMinutes,
  extractArticle,
  extractFallbackArticle,
} from "../core";

const extractedAt = "2026-08-06T12:00:00.000Z";

describe("article extraction fixtures", () => {
  it("extracts a Medium-style article and removes surrounding noise", () => {
    const document = loadFixture("medium-article.html");
    const originalMarkup = document.documentElement.outerHTML;
    const article = extractArticle(
      document,
      "https://medium.example/designing-calm-software",
      extractedAt,
    );

    expect(article).toMatchObject({
      title: "Designing Calm Software",
      author: "Maya Chen",
      siteName: "Medium Example",
      paragraphCount: 4,
      estimatedReadingMinutes: 1,
    });
    expect(article?.headingCount).toBeGreaterThanOrEqual(1);
    expect(article?.wordCount).toBeGreaterThanOrEqual(80);
    expect(allArticleText(article)).not.toMatch(
      /DISTRACTING|NEWSLETTER|COMMENT THREAD|RELATED ARTICLE/,
    );
    expect(document.documentElement.outerHTML).toBe(originalMarkup);
  });

  it("extracts a Wikipedia-style article with ordered headings", () => {
    const article = extractArticle(
      loadFixture("wikipedia-article.html"),
      "https://en.wikipedia.org/wiki/Distributed_computing",
      extractedAt,
    );

    expect(article?.title).toContain("Distributed computing");
    expect(article?.siteName).toBe("Wikipedia");
    expect(article?.paragraphCount).toBe(4);
    expect(article?.blocks.some((block) => block.kind === "heading")).toBe(
      true,
    );
    expect(allArticleText(article)).not.toContain("TALK PAGE COMMENTS");
  });

  it("uses fallback extraction for a semantic developer blog", () => {
    const article = extractFallbackArticle(
      loadFixture("dev-blog.html"),
      "https://dev.example/reliable-typescript-boundaries",
      extractedAt,
    );

    expect(article).toMatchObject({
      extractionMethod: "fallback",
      title: "Reliable TypeScript Boundaries",
      author: "Arun Rao",
      siteName: "Practical Dev Notes",
      paragraphCount: 4,
    });
    expect(allArticleText(article)).not.toContain("RELATED TUTORIAL");
  });

  it("rejects a page without substantial article content", () => {
    const document = loadFixture("page-without-article.html");

    expect(
      extractArticle(document, "https://directory.example/", extractedAt),
    ).toBeUndefined();
    expect(
      extractFallbackArticle(
        document,
        "https://directory.example/",
        extractedAt,
      ),
    ).toBeUndefined();
  });

  it("extracts and estimates a long technical article", () => {
    const article = extractArticle(
      loadFixture("long-technical-article.html"),
      "https://systems.example/durable-event-pipeline",
      extractedAt,
    );

    expect(article).toMatchObject({
      title: "Building a Durable Event Pipeline",
      author: "Leila Morgan",
      siteName: "Systems Field Guide",
      paragraphCount: 9,
    });
    expect(article?.headingCount).toBeGreaterThanOrEqual(4);
    expect(article?.wordCount).toBeGreaterThan(250);
    expect(article?.estimatedReadingMinutes).toBeGreaterThanOrEqual(2);
    expect(
      estimateListeningMinutes(article?.wordCount ?? 0, 1),
    ).toBeGreaterThan(article?.estimatedReadingMinutes ?? 0);
    expect(allArticleText(article)).not.toContain("VENDOR ADVERTISEMENT");
  });
});

function loadFixture(filename: string): Document {
  const html = readFileSync(resolve("tests", "fixtures", filename), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function allArticleText(article: ReturnType<typeof extractArticle>): string {
  return article?.blocks.map((block) => block.text).join(" ") ?? "";
}
