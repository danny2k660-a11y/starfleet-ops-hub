# Starfleet Ops Hub

Build the initial version of a responsive web application called STO Command Center.



This is a personal Star Trek Online account, ship, loadout and build management application.



For this first stage, do NOT build the complete application yet.



Create only the basic application foundation.



Requirements:



1. Use a modern responsive interface that works on Android phones, tablets and desktop browsers.



2. Use a dark futuristic Star Trek-inspired interface.



3. Create a main dashboard with navigation for:



- Dashboard

- Characters

- Ships

- Builds

- Inventory

- Equipment

- Traits

- Themes

- Projects

- Resources

- Settings



4. Create a clean sidebar on desktop and mobile-friendly navigation on smaller screens.



5. Create placeholder pages for each section so we can build them individually later.



6. Create a dashboard showing placeholder cards for:



- Characters

- Ships

- Active Builds

- Active Projects

- Resources



7. Connect the project to Supabase.



8. Use Supabase for the application's database and authentication.



9. Do not create the full STO database yet.



10. Do not invent STO ship statistics yet.



11. Do not populate the application with fictional STO equipment.



12. Build the application architecture so that we can later add a proper STO ship database containing:



- Hull modifier

- Shield modifier

- Hull strength

- Shield strength

- Turn rate

- Inertia

- Impulse modifier

- Weapon layout

- Console layout

- Bridge officer stations

- Hangar bays

- Experimental weapon slot

- Special ship abilities

- Ship traits

- Other base ship statistics



13. The most important future relationship is:



STO Ship Database

→ Ship Instance

→ Character

→ Build

→ Loadout

→ Equipment



14. Keep the STO ship database separate from the user's personal ship instances.



For example, the database definition of a Rex should be separate from the user's personal ship named "I.S.S. Predator".



15. The application must eventually support multiple characters and must never assume that all equipment is available to every character.



16. Do not add payment systems.



17. Do not add advertising.



18. Keep the project compatible with free-tier services.



For now, concentrate on creating a clean working application shell and Supabase connection.



Do not implement advanced AI features yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b9e89ab-355b-4779-9274-808bef042dde).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
