class Bearsays < Formula
  desc "A fun CLI tool that makes bears say things"
  homepage "https://code.bearcove.cloud/bearcove/bearsays"
  version "1.5.0"
  license "MIT"

  if OS.mac?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v1.5.0/aarch64-apple-darwin.tar.xz",
        headers: { "Authorization" => "token 84b4b6c143f3c96dc56dbb3b098646dea1b57485" }
    sha256 "fc5d41bfd8b53d650c4b4e9201d294c817d41bb0df5cd0a20852d08c83533201"
  elsif OS.linux?
    url "https://code.bearcove.cloud/api/packages/bearcove/generic/bearsays/v1.5.0/x86_64-unknown-linux-gnu.tar.xz",
        headers: { "Authorization" => "token 84b4b6c143f3c96dc56dbb3b098646dea1b57485" }
    sha256 "d08b16430a16492a19e4237b55c90575b70ff7d3e4a3d0550438dea2c56e63ca"
  end

  def install
    bin.install "bearsays"
  end

  test do
    assert_match "BearSays version #{version}", shell_output("#{bin}/bearsays --version")
  end
end