# Audio Transcribe and Comment
This is my personal attempt at craeting a small web application where users can upload audio files, preferably dialogues, which will then be transformed as text by the system.

Additionally users can highlight sections of the track and comment them.

The application currently is under heavy development and the list of things to do is actually getting bigger the more I complete it's elements.

## TODO
- redesign UI code using a framework
- add a toggle button to display all comments, independently of the play status
- export all comments as text
- add a search function
- add pagination to lists
- add filters
- manage permissions (partially done)
- add admin functions
    - manage users
    - manage tracks
    - manage comments
- dropzone for file upload
- add tracking / watch 
    - with notifications on changes
- add favourite
- add some visual clue regarding description save as currently it just saves but the user is not informed
- add possibility to make tracks private
- add possibility to create user groups
- add invitation to private tracks to users and groups
- add tags
- prepare docker compose with correct volumes for db and uploads



## DONE
- add text to the track (model reference already present)
- load comments as they reach the played section/region
- move insert form to the top
- add audio recording directly in the website
    - record as push button
    - SKIPPED record with toggle button
- Docker image (tried python:3.11-bookworm but the image is 1.5GB, so I switched to alpine )
- player does not handle webm well as hover and media bar do not sync, fixed by server side converting all tracks to mp3
- add login / user management 
- transcription via whispher model
- transcription can be edited and saved
- do something with the home page