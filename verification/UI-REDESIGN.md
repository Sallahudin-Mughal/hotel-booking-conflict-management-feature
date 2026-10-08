# Hotel-style UI update

Implemented a cinematic property header with a muted looping hotel video, warm cream cards, dark green controls, serif headings, responsive form layout, and a pause/play control. Reduced-motion preferences disable automatic video loading and playback; a poster image remains visible. Booking validation and storage behavior are unchanged.

Media is loaded externally and requires an internet connection. The dark header background and readable content remain available if external media is unavailable.

Video and poster: cottonbro studio, Pexels, “Shot of a Hotel Room with an Open Door”:
https://www.pexels.com/video/shot-of-a-hotel-room-with-an-open-door-7507165/

The published HD video endpoint returned HTTP 200. Browser playback was verified with readyState 4 and paused false. Pause and resume were both checked through the visible controls.

Validation: 30 tests passed; production build passed (33 modules, 3.65 seconds). Desktop and 375 x 812 mobile screenshots were inspected. Mobile page width stayed within the viewport. The separate native demo-confirmation limitation from RESULTS.md is not reclassified by this UI check.

Screenshots: redesign-desktop.png and redesign-mobile.png.
