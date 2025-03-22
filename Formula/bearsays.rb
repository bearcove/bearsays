# frozen_string_literal: true

# Cool bear says stuff
class Bearsays < Formula
  desc "Cool bear says stuff"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "2.3.2"
  license "MIT+Apache-2.0"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.2/aarch64-apple-darwin.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "0574dd13edc137d5fe9aa550b86795b930bceb0bf8c74017253c150c2833e92c"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v2.3.2/x86_64-unknown-linux-gnu.tar.xz", headers: ["Authorization: token 84b4b6c143f3c96dc56dbb3b098646dea1b57485"]
    sha256 "66f6334637a32f03af95162d8a23887e105929b9b9097efdbe41600fdd0d64c7"
  end

  def install
    bin.install "bearsays"
  end

  test do
    assert_match "#bearsays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end
