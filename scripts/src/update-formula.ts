#!/usr/bin/env node

import { promises as fs } from "fs";
import chalk from "chalk";
import crypto from "crypto";
import { formatBytes } from "./utils.ts";

// Define the template for the Homebrew formula
const formulaTemplate = `
class Bearsays < Formula
  desc "A fun CLI tool that makes bears say things"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "{{VERSION}}"
  license "MIT"

  if OS.mac?
    url "{{MAC_URL}}"
    sha256 "{{MAC_SHA}}"
  elsif OS.linux?
    url "{{LINUX_URL}}"
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

async function generateHomebrewFormula(): Promise<void> {
    console.log(chalk.yellow("🍺 Generating Homebrew formula..."));

    const owner = "bearcove";
    const repo = "bearsays";
    const version = "1.4.0"; // Updated version

    const baseUrl = "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays";
    const macUrl = `${baseUrl}/v${version}/aarch64-apple-darwin.tar.xz`;
    const linuxUrl = `${baseUrl}/v${version}/x86_64-unknown-linux-gnu.tar.xz`;

    console.log(chalk.cyan("🔗 Fetching Mac binary..."));
    const macResponse = await fetch(macUrl);
    const macBuffer = await macResponse.arrayBuffer();
    const macSha256 = await computeSha256(macBuffer);
    console.log(chalk.green(`✅ Mac binary fetched. Size: ${formatBytes(macBuffer.byteLength)}`));

    console.log(chalk.cyan("🔗 Fetching Linux binary..."));
    const linuxResponse = await fetch(linuxUrl);
    const linuxBuffer = await linuxResponse.arrayBuffer();
    const linuxSha256 = await computeSha256(linuxBuffer);
    console.log(
        chalk.green(`✅ Linux binary fetched. Size: ${formatBytes(linuxBuffer.byteLength)}`),
    );

    let formula = formulaTemplate
        .replace("{{VERSION}}", version)
        .replace("{{MAC_URL}}", macUrl)
        .replace("{{MAC_SHA}}", macSha256)
        .replace("{{LINUX_URL}}", linuxUrl)
        .replace("{{LINUX_SHA}}", linuxSha256);

    console.log(chalk.yellow("📝 Generated Homebrew formula:"));
    console.log(chalk.cyan(formula));

    const formulaPath = "Formula/bearsays.rb";
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
