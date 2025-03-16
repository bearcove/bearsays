#!/usr/bin/env node

import { promises as fs } from "fs";
import chalk from "chalk";
import crypto from "crypto";
import { formatBytes } from "./utils.ts";

// Define the authorization token
const AUTH_TOKEN = "84b4b6c143f3c96dc56dbb3b098646dea1b57485";
// Define the template for the Homebrew formula
const formulaTemplate = `
class Bearsays < Formula
  desc "A fun CLI tool that makes bears say things"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "{{VERSION}}"
  license "MIT"

  if OS.mac?
    url "{{MAC_URL}}",
        headers: [
          "Authorization: token {{AUTH_TOKEN}}"
        ]
    sha256 "{{MAC_SHA}}"
  elsif OS.linux?
    url "{{LINUX_URL}}",
        headers: [
          "Authorization: token {{AUTH_TOKEN}}"
        ]
    sha256 "{{LINUX_SHA}}"
  end

  def install
    bin.install "bearsays"
  end

  test do
    assert_match "BearSays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end
`.trim();

interface BinaryInfo {
    sha256: string;
    size: number;
}

async function fetchBinaryAndComputeSha256(url: string, headers: HeadersInit): Promise<BinaryInfo> {
    console.log(chalk.cyan(`🔗 Fetching binary from ${url}...`));
    const response = await fetch(url, { headers });

    if (response.status !== 200) {
        throw new Error(`Failed to fetch binary. Status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    if (size < 100 * 1024) {
        // 100KB
        throw new Error(`Binary size is too small: ${formatBytes(size)}`);
    }

    const sha256 = await computeSha256(buffer);
    console.log(chalk.green(`✅ Binary fetched. Size: ${formatBytes(size)}`));

    return { sha256, size };
}

async function generateHomebrewFormula(): Promise<void> {
    console.log(chalk.yellow("🍺 Generating Homebrew formula..."));

    const owner = "bearcove";
    const repo = "bearsays";
    const version = await getLatestVersion();

    async function getLatestVersion(): Promise<string> {
        const { execSync } = await import("child_process");
        const tags = execSync("git tag -l").toString().trim().split("\n");
        const versions = tags
            .map((tag) => tag.replace("v", ""))
            .sort((a, b) => {
                const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
                const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
                if (aMajor !== bMajor) return bMajor - aMajor;
                if (aMinor !== bMinor) return bMinor - aMinor;
                return bPatch - aPatch;
            });
        return versions[0];
    }

    const baseUrl = `https://code.bearcove.cloud/api/packages/${owner}/generic/${repo}`;
    const macUrl = `${baseUrl}/v${version}/aarch64-apple-darwin.tar.xz`;
    const linuxUrl = `${baseUrl}/v${version}/x86_64-unknown-linux-gnu.tar.xz`;

    const headers = {
        Authorization: `token ${AUTH_TOKEN}`,
    };

    const { sha256: macSha256 } = await fetchBinaryAndComputeSha256(macUrl, headers);
    const { sha256: linuxSha256 } = await fetchBinaryAndComputeSha256(linuxUrl, headers);

    let formula = formulaTemplate
        .replace("{{VERSION}}", version)
        .replace("{{MAC_URL}}", macUrl)
        .replace("{{MAC_SHA}}", macSha256)
        .replace("{{LINUX_URL}}", linuxUrl)
        .replace("{{LINUX_SHA}}", linuxSha256)
        .replace(/{{AUTH_TOKEN}}/g, AUTH_TOKEN);

    console.log(chalk.yellow("📝 Generated Homebrew formula:"));
    console.log(chalk.cyan(formula));

    const formulaPath = `Formula/${repo}.rb`;
    await fs.writeFile(formulaPath, formula);
    console.log(chalk.green(`✅ Homebrew formula written to ${formulaPath}`));
}

async function computeSha256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
    await generateHomebrewFormula();
}

main().catch((error: Error) => {
    console.error(chalk.red("An error occurred:"));
    console.error(error);
    process.exit(1);
});
