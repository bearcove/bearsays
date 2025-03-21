# this is a Justfile, not a makefile

update-formula:
    pnpm -C scripts install
    pnpm -C scripts check
    node scripts/src/update-formula.ts
