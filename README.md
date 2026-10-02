# Starfleet Ops Hub

A mobile-first STO Command Center for managing personal Star Trek Online characters, ships, builds, loadouts, equipment, inventory, themes and projects.

## Current state

- Supabase authentication and user-scoped data
- Character registry with character-specific asset separation
- STO ship catalogue + personal owned-ship registry
- Character → owned ship → build relationships
- Build library and named loadouts
- Loadout readiness checks for equipment, traits and bridge-officer stations
- Theme-compliance tracking
- Equipment locker with account-wide/character-bound ownership
- Inventory tracking by character and storage location
- Character operations overview
- Dashboard fleet/captain readiness views
- Mobile-responsive Star Trek-inspired interface
- Android debug APK build through GitHub Actions

## Data model

`STO Ship Database → Personal Ship Instance → Character → Build → Loadout → Equipment`

The STO catalogue describes the ship itself. A personal ship record represents the user's copy of that ship, including its custom name, owner character, upgrade state, current build and theme.

Character-bound equipment and inventory remain tied to the owning character rather than being treated as universally available.

## STO data policy

The ship catalogue is designed for **verified STO data only**. No fictional ship statistics or fictional equipment are used as production data. Catalogue records include source/reference and data-version fields so future imports can be audited and refreshed without mixing source data with personal account data.

## Android build

GitHub Actions produces a debug APK from the same application source. The workflow builds the web application, creates/synchronizes the Capacitor Android project, builds the APK and verifies the resulting package before publishing it as an artifact.

## Development

```sh
npm install
npm run dev
```

The app expects the Supabase project URL and publishable/anonymous key through the project's existing environment configuration.

## Free-tier goal

The application is designed to remain compatible with free-tier hosting/database services. It contains no advertising or payment system.

## Lovable

This project remains connected to Lovable for visual/application development and GitHub synchronization.
