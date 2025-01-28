import os
import uuid
import random
import string
from flask import render_template
from flask import url_for
from flask import Blueprint
from flask import flash
from flask import redirect
from flask import request
from flask import current_app
from flask import send_from_directory
from flask import jsonify

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
    # TODO load number of comments
    tracks = Track.query.all()
    return render_template('list.html', tracks=tracks)

@app.route('/track/<file>/play')
def play(file):
    track = Track.query.filter(Track.local_name == file).first()
    return render_template('play.html', track=track)

@app.route('/track/<path:filename>')
def track(filename):
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

@app.route('/track/<file>/regions', methods=['GET'])
def track_regions_load(file):
    track = Track.query.filter(Track.local_name == file).first()
    # TODO check if there is already a region with the same native_id and track_id to update
    regions = Region.query.filter(Region.track_id == track.id).order_by(Region.start).all()
    out = []
    for region in regions:
        current_app.logger.debug(f'serializing region: {region.to_json()}')
        out.append( region.to_dict() )
        
    return jsonify(out)

@app.route('/track/<file>/region', methods=['POST'])
def track_region_save(file):
    current_app.logger.info(request.json)
    track = Track.query.filter(Track.local_name == file).first()
    # DONE check if there is already a region with the same native_id and track_id to update
    # TODO handle discrepancies betweeb native_id and id
    region = Region.query.filter((Region.native_id == request.json.get('id')) & (Region.track_id == track.id)).first()    
    if region:
        region.start = request.json.get('start')
        region.end = request.json.get('end')
        region.title = request.json.get('title')
        db.session.commit()
    else:  
        region = Region(
        start = request.json.get('start'),
        end = request.json.get('end'),
        title = request.json.get('title'),
        native_id = request.json.get('native_id'),
        track_id = track.id
        )
        db.session.add(region)
        db.session.commit()

    #TODO save json data as Section
    #TODO save section comments
    return 'saved', 200


@app.route('/track/<file>/description', methods=['GET'])
def track_description_load(file):
    track = Track.query.filter(Track.local_name == file).first()   
    comment = Comment.query.filter( (Comment.track_id == track.id)).first()       
    if comment:
        return jsonify( {'text':comment.text})
    else:
        return 'no data', 404

@app.route('/track/<file>/description', methods=['POST'])
def track_description_save(file):
    current_app.logger.info(request.json)
    track = Track.query.filter(Track.local_name == file).first()   
    comment = Comment(
        track_id = track.id,
        text = request.json.get('text')
    ) 
    db.session.add(comment)
    db.session.commit()
    return 'saved', 200


@app.route('/track/<file>/region/<regionid>/comment/<commentid>', methods=['GET'])
def track_region_comment(file, regionid, commentid):
    pass

@app.route('/comment/<commentid>', methods=['GET'])
def comment(commentid):
    comment = Comment.query.filter( (Comment.id == commentid)).first()       
    if comment:
        return jsonify( {'text':comment.text})
    else:
        return 'no data', 404

@app.route('/track/<file>/region/<regionid>/comments', methods=['GET'])
def track_region_comments_load(file, regionid):
    out = []
    track = Track.query.filter(Track.local_name == file).first()   
    # region = Region.query.filter((Region.native_id == regionid) & (Region.track_id == track.id)).first()  
    region = Region.query.filter(Region.id == regionid).first()  
    comments = Comment.query.filter( (Comment.region_id == region.id)).all()       
    if comments:
        for comment in comments:
            out.append( comment.to_dict() )
        return jsonify( out )
    else:
        return 'no data', 404

@app.route('/track/<file>/region/<regionid>/comment', methods=['POST'])
def track_region_comment_save(file, regionid):
    track = Track.query.filter(Track.local_name == file).first()
    region = Region.query.filter((Region.native_id == regionid) & (Region.track_id == track.id)).first()  
    comment = Comment(
        region_id = region.id,
        text = request.json.get('text')
    ) 
    db.session.add(comment)
    db.session.commit()
    return 'saved', 200