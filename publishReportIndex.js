/* eslint-env node */

"use strict";

const fs = require("fs");
const path = require("path");

const INDEX_FILE = "docs/reportIndex.json";
const TEMPLATE_FILE = "reportIndexTemplate.html";
const OUTPUT_FILE = "docs/reportIndex.html";

/** @type {Object<String, String>} */
const STATE_NAMES = {
    "OR": "Oregon",
    "WA": "Washington State",
    "BC": "British Columbia"
};

/**
 * Group index entries by state.
 * @param {Object} index
 * @return {Object<String, Array>} Entries keyed by state code
 */
function groupByState(index) {
    const byState = {};

    for (const [name, entries] of Object.entries(index)) {
        for (const entry of entries) {
            const state = entry.state;
            if (!byState[state]) byState[state] = [];
            byState[state].push({ name, ...entry });
        }
    }

    // Sort each state's entries alphabetically by name
    for (const state of Object.keys(byState)) {
        byState[state].sort((a, b) => a.name.localeCompare(b.name));
    }

    return byState;
}

/**
 * Render the HTML for a single state section.
 * @param {String} stateCode
 * @param {Array} entries
 * @return {String}
 */
function renderStateSection(stateCode, entries) {
    const stateName = STATE_NAMES[stateCode] || stateCode;

    const rows = entries.map(entry => `
        <tr>
            <td>${entry.name}</td>
            <td>${entry.year}</td>
            <td><a href="reports/${entry.report}">Download PDF</a></td>
        </tr>`).join("");

    return `
    <section>
        <h2 id=${stateCode}>${stateName}</h2>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Year</th>
                    <th>Report</th>
                </tr>
            </thead>
            <tbody>${rows}
            </tbody>
        </table>
    </section>`;
}

/**
 * Generate the full HTML page by filling placeholders in the template.
 * Placeholders: {{date}}, {{navLinks}}, {{sections}}
 * @param {Object} byState
 * @return {String}
 */
function renderHTML(byState) {
    const stateCodes = Object.keys(byState).sort((a, b) => {
        const nameA = STATE_NAMES[a] || a;
        const nameB = STATE_NAMES[b] || b;
        return nameA.localeCompare(nameB);
    });

    const sections = stateCodes.map(code => renderStateSection(code, byState[code])).join("\n");

    const navLinks = stateCodes.map(code => {
        const name = STATE_NAMES[code] || code;
        return `<a href="#${code}">${name}</a>`;
    }).join("\n        ");

    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

    return template
        .replace("{{date}}", new Date().toISOString().slice(0, 10))
        .replace("{{navLinks}}", navLinks)
        .replace("{{sections}}", sections);
}

/**
 * Main entry point — read index, write HTML.
 * @return {void}
 */
function publish() {
    const raw = fs.readFileSync(INDEX_FILE, "utf8");
    const index = JSON.parse(raw);
    const byState = groupByState(index);
    const html = renderHTML(byState);
    fs.writeFileSync(OUTPUT_FILE, html, "utf8");
    console.log(`Written to ${OUTPUT_FILE}`);
}

publish();
