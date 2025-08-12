{
  description = "A flake that installs Node.js";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-darwin"; # Change to your system if needed
      pkgs = import nixpkgs { inherit system; };
    in {
      packages.${system}.default = pkgs.nodejs;
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [ pkgs.nodejs ];
      };
    };
}