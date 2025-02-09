# Audio Transcribe and Comment
This is my personal attempt at craeting a small web application where users can upload audio files, preferably dialogues, which will then be transformed as text by the system.

Additionally users can highlight sections of the track and comment them.

The application currently is under heavy development and the list of things to do is actually getting bigger the more I complete it's elements.

## TODO
- redesign UI
- add a toggle button to display all comments, independently of the play status
- export all comments as text
- add a search function
- add login / user management
- manage permissions
- add admin functions
    - manage users
    - manage tracks
    - manage comments
- dropzone for file upload
- add tracking / watch 
    - with notifications on changes
- add favourite
- add some visual clue regarding description save as currently it just saves but the user is not informed
- player does not handle webm well as hover and media bar do not sync

## DONE
- add text to the track (model reference already present)
- load comments as they reach the played section/region
- move insert form to the top
- add audio recording directly in the website
    - record as push button
    - SKIPPED record with toggle button