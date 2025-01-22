import os
import uuid
import random
import string
from flask import render_template, url_for, Blueprint, flash, redirect, request, current_app, send_from_directory, jsonify

from models.conn import db
from models.models import Track, Region, Comment

import modules.filechecker as filechecker

app = Blueprint('default', __name__)


@app.route('/')
def home():
    # return "Hello, Flask!"
    return render_template('base.html')

@app.route('/about')
def about():
    return "Questo è un sito mini fatto per provare come funziona Flask"

@app.route('/hello')
def hello_anonimo():
    return url_for('hello', name='Alice')

@app.route('/list')
def list():
    tracks = Track.query.all()
    return render_template('list.html', tracks=tracks)

@app.route('/track/<file>/play')
def play(file):
    track = Track.query.filter(Track.local_name == file).first()
    return render_template('play.html', track=track)

@app.route('/uploads/<path:filename>')
def uploads(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['GET'])
def upload():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_form_post():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)    
    
    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        current_app.logger.error('No selected file')
        return redirect(request.url)
    
    if not filechecker.allowed_file_ext(file.filename):
        flash('Invalid file type')
        current_app.logger.error(f'Invalid file type for file {file.filename}')
        return redirect(request.url)
    
    if file:
        try:
            local_filename = uuid.uuid4().hex
            # filename = f'{uuid.uuid4().hex}.{filechecker.get_file_ext(file.filename)}'
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], local_filename)
            file.save(filepath)

            track = Track(
                name=file.filename,
                local_name = local_filename)
            db.session.add(track)
            db.session.commit()
        except Exception as e:
            current_app.logger.exception(f'Error saving file {file.filename} as {filepath}')
        return redirect(url_for('default.play', file=local_filename))
    return None

@app.route('/track/<file>/saveregion', methods=['POST'])
def saveregion(file):
    '''
    {
        start:region.start, -> region.start
        end:region.end, -> region.end
        id:region.id, -> region.internal_id
        title:region.content -> region.title
    }
    '''
    current_app.logger.info(request.json)
    track = Track.query.filter(Track.local_name == file).first()
    region = Region(
        start = request.json.get('start'),
        end = request.json.get('end'),
        title = request.json.get('title'),
        internal_id = request.json.get('id'),
        track_id = track.id
    )
    db.session.add(region)
    db.session.commit()
    

    
    #TODO save json data as Section
    #TODO save section comments
    return jsonify(request.json), 200



