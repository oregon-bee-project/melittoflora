/* eslint-env node */

"use strict";

const fs = require("fs");
const path = require("path");

const REPORTS_DIR = "docs/reports";
const INDEX_DIR = "docs/";

/**
 * Parse a report filename into its component parts.
 * @param {String} filename
 * @return {Object|null} Parsed components or null if unrecognised
 */
function parseFilename(filename) {
    const match = filename.match(/^(.+)_([A-Z]{2})_(\d{4})_Summary\.pdf$/);
    if (!match) return null;

    const namePart = match[1].replace(/_/g, " ");
    const state = match[2];
    const year = parseInt(match[3], 10);

    return { name: namePart, state, year };
}

/**
 * Build a report index JSON file from PDFs in the reports directory.
 * @return {void}
 */
function buildIndex() {
    fs.mkdirSync(INDEX_DIR, { recursive: true });

    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith(".pdf"));
    const index = {};

    for (const file of files) {
        const parsed = parseFilename(file);
        if (!parsed) {
            console.warn(`Skipping unrecognised filename: ${file}`);
            continue;
        }

        const { name, state, year } = parsed;
        if (!index[name]) index[name] = [];

        index[name].push({ state, year, report: file });
    }

    const outPath = path.join(INDEX_DIR, "reportIndex.json");
    fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
    console.log(`Wrote index with ${Object.keys(index).length} entries to ${outPath}`);
}

buildIndex();