# frozen_string_literal: true

# Cool bear says stuff
class Bearsays < Formula
  desc "Cool bear says stuff"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "2.2.0"
  license "MIT+Apache-2.0"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.2.0/aarch64-apple-darwin.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "5f493741094f9266624e350dff9e8fbb50e02bd6f5d10d8e6533c2d15a074a1d"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.2.0/x86_64-unknown-linux-gnu.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "c387d5c23cb0ea315bfc0d4c054815d300881366e75ce0309b7e60b3ad971c64"
  end

  def install
    bin.install "bearsays"
  end

  test do
    assert_match "#bearsays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end
