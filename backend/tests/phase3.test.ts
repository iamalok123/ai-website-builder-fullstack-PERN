import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeForPublicPreview } from "../lib/sanitizeHtml.js";
import { createProjectBodySchema, revisionBodySchema } from "../lib/validationSchemas.js";
import { getCreditPlan } from "../services/paymentService.js";

test("public preview sanitizer removes untrusted executable code", () => {
    const sanitized = sanitizeForPublicPreview(`
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                <script>alert("bad")</script>
            </head>
            <body>
                <button onclick="alert('bad')">Click</button>
                <a href="javascript:alert('bad')">Bad link</a>
            </body>
        </html>
    `);

    assert.match(sanitized, /cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4/);
    assert.doesNotMatch(sanitized, /<script>alert/);
    assert.doesNotMatch(sanitized, /onclick=/);
    assert.doesNotMatch(sanitized, /javascript:/);
});

test("sanitizer replaces generated local image paths and removes embeds", () => {
    const sanitized = sanitizeForPublicPreview(`
        <!DOCTYPE html>
        <html>
            <head></head>
            <body>
                <img src="/images/hero.jpg">
                <iframe src="https://example.com/embed"></iframe>
                <object data="bad.swf"></object>
                <embed src="bad.swf">
            </body>
        </html>
    `);

    assert.match(sanitized, /https:\/\/picsum\.photos\/800\/600\?random=/);
    assert.doesNotMatch(sanitized, /src="\/images\/hero\.jpg"/);
    assert.doesNotMatch(sanitized, /<iframe/i);
    assert.doesNotMatch(sanitized, /<object/i);
    assert.doesNotMatch(sanitized, /<embed/i);
});

test("project and revision schemas reject blank prompts", () => {
    assert.equal(createProjectBodySchema.safeParse({ initial_prompt: "Build a portfolio" }).success, true);
    assert.equal(createProjectBodySchema.safeParse({ initial_prompt: " " }).success, false);
    assert.equal(revisionBodySchema.safeParse({ message: "Make the hero clearer" }).success, true);
    assert.equal(revisionBodySchema.safeParse({ message: "" }).success, false);
});

test("credit plan lookup accepts known plans and rejects unknown plans", () => {
    assert.equal(getCreditPlan("basic")?.credits, 100);
    assert.equal(getCreditPlan("enterprise")?.amount, 49);
    assert.equal(getCreditPlan("unknown"), undefined);
});
