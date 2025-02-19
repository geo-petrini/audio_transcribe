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
from flask_login import current_user
from flask_login import login_required
from werkzeug.utils import secure_filename
from models.conn import db
from models.models import Track, Region, Comment, User, Transcription,TranscriptionSegment, _getAnonymous

from modules.filechecker import allowed_file_ext, get_upload_folder_full_path
import modules.converter as converter
import modules.stt as stt

app = Blueprint('default', __name__)

#TODO reorganize methods, there is way too much stuff in here

@app.route('/')
def home():
    # return "Hello, Flask!"
    return render_template('base.html')

@app.route('/list')
def list():
    # TODO load number of comments
    tracks = Track.query.all()
    current_app.logger.debug(f'tracks list: {tracks}')
    return render_template('list.html', tracks=tracks)

@app.route('/track/<file>/play')
def play(file):
    # TODO check return as track is not used in the template anymore
    track = Track.query.filter(Track.local_name == file).first()
    return render_template('play.html', track=track)

@app.route('/track/<file>/transcribe')
def transcribe(file):
    track = Track.query.filter(Track.local_name == file).first()
    upload_folder = get_upload_folder_full_path()
    track_path = os.path.join(upload_folder, track.local_name)   
    result = stt.transcribe(track_path)
    return jsonify(result)

@app.route('/track/<file>/transcription', methods=['GET'])
def track_transcription_load(file):
    track = Track.query.filter(Track.local_name == file).first()
    transcription = Transcription.query.filter(Transcription.track_id == track.id).first()
    if (transcription):
        return jsonify(transcription.to_dict())
    else:
        return jsonify(f'no transcription for track {file}'), 404

@app.route('/track/<file>/transcription', methods=['POST'])
def track_transcription_save(file):
    track = Track.query.filter(Track.local_name == file).first()
    transcription = Transcription.query.filter(Transcription.track_id == track.id).first()

    if (transcription):
        try:
            current_app.logger.debug(f'transcription for track {track.local_name} already exists, updating')
            data = {
                'language' : request.json.get('language'),
            }            
            _update_transcription(transcription, data)
            _update_transcription_segments(transcription, request.json.get('segments'))
        except Exception as e:
            current_app.logger.exception(f'error updating transcription {request.json}')
            return jsonify('error updating transcription'), 500
    
    else:
        try:
            data = {
                'language' : request.json.get('language'),
                'track_id' : track.id,
                'user_id':current_user.id if not current_user.is_anonymous else _getAnonymous().id
            }
            transcription = _save_transcription(data)
        except Exception as e:
            current_app.logger.exception(f'error saving transcription {request.json}')
            return jsonify('error saving transcription'), 500
    
        try:
            _save_transcription_segments(transcription, request.json.get('segments'))
        except Exception as e:
            current_app.logger.exception(f'error saving transcription segments {request.json.get('segments')}')
            return jsonify('error saving transcription segments'), 500
    
    return jsonify(transcription.to_dict()), 200

def _save_transcription(data):
    transcription = Transcription(**data)
    db.session.add(transcription)
    db.session.commit()
    return transcription

def _update_transcription(transcription, data):
    transcription.language = data['language']
    db.session.commit()

def _save_transcription_segments(transcription, segments):
    out = []
    for segment in segments:
        t_segment = TranscriptionSegment(
            text = segment['text'],
            start = segment['start'],
            end = segment['end'],
            transcription_id = transcription.id
        )
        db.session.add(t_segment)
        db.session.commit()
        out.append(t_segment)
    return out

def _update_transcription_segments(transcription, segments):
    # TODO find a better way to update the segments instead of erasing everything and re-save them all
    _delete_transcription_segments(transcription)
    return _save_transcription_segments(transcription, segments)

def _delete_transcription_segments(transcription):
    segments = TranscriptionSegment.query.filter(TranscriptionSegment.transcription_id == transcription.id).all()
    for segment in segments:
        db.session.delete(segment)

@app.route('/track/<file>', methods=['DELETE'])
@app.route('/track/<file>/delete')
@login_required
def delete_track(file):
    current_app.logger.debug(f'request: {request}')
    track = Track.query.filter(Track.local_name == file).first()
    if (track):
        if (current_user.id == track.user_id):
            try:                
                db.session.delete(track)
                _delete_track_file(track.local_name)
                db.session.commit()
                current_app.logger.info(f'track: {track} deleted')
            except Exception as e:
                flash('Error deleting track')
                current_app.logger.exception(f'Error deleting track {file}')
                return 'Error deleting track', 500
        else:
            flash('User is not owner of this track')
            return 'User is not owner of this track', 401
    if request.referrer:
        return redirect(request.referrer)
    return redirect( url_for('default.home') )
            
@app.route('/track/<path:filename>')
def track(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['GET'])
def upload():
    return render_template('upload.html')


@app.route('/upload', methods=['POST'])
def upload_form_post():  
    file = None
    local_filename = None
    try:
        if request.files:
            file = _handle_file_track_upload(request)
        elif request.json:
            file = _handle_json_track_upload(request)
        else:
            return _handle_error('No file part')        
        (filename, local_filename, filepath) = _save_track_file(file)
        _convert_track(file, local_filename)
        _save_track_record(filename, local_filename)

        if request.files:
            return redirect(url_for('default.play', file=local_filename))
        elif request.json:
            response = {'url':url_for('default.play', file=local_filename)}
            return jsonify(response)
        
    except Exception as e:
        current_app.logger.exception(f'Error saving file {file} as {local_filename}')
        return _handle_error('Error saving track')

def _convert_track(file, local_filename):
    upload_folder = get_upload_folder_full_path()
    inputfile = os.path.join(upload_folder, local_filename)
    outputfile = f'{inputfile}.mp3'
    if (file.content_type != 'audio/mpeg'):
        convert_result = converter.convert(inputfile, outputfile)
        current_app.logger.debug(f'conversion result: {convert_result} ({type(convert_result)})')
        if (convert_result == 0):
            os.remove(inputfile)
            os.rename(outputfile, inputfile)
            current_app.logger.debug(f'renamed {outputfile} as {inputfile}')

def _delete_track_file(local_filename):
    #TODO move to a more suitable location
    upload_folder = get_upload_folder_full_path()
    track_path = os.path.join(upload_folder, local_filename)    
    return os.remove(track_path)

def _save_track_file(file):
    # Salvataggio del file sul disco
    filename = secure_filename(file.filename)
    local_filename = uuid.uuid4().hex
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], local_filename)
    file.save(filepath)
    current_app.logger.info(f'file {filename} of type {file.content_type} as {local_filename}')
    return (filename, local_filename, filepath)

def _save_track_record(filename, local_filename):   
    # salvataggio come record
    track = Track(
        name=filename.split(".")[0],  #save the filename without extension
        local_name=local_filename,
        user_id=current_user.id if not current_user.is_anonymous else _getAnonymous().id
    )
    db.session.add(track)
    db.session.commit()

def _handle_file_track_upload(request):
    # 2. Estrazione del file dall'istanza della richiesta
    file = request.files['file']
    # 3. Controllo dell'estensione del file
    if not allowed_file_ext(file.filename):
        return _handle_error('Invalid file type')   
    return file 

def _handle_json_track_upload(request):
    import io
    import base64
    from werkzeug.datastructures import FileStorage

    # current_app.logger.debug(f'request json: {request.json}')
    file = FileStorage(
        stream=io.BytesIO(  base64.b64decode(request.json.get('track')) ),
        filename=request.json.get('name'),
        content_type=request.json.get('type'),
        name='file'
    )
    # current_app.logger.debug(f'file: {file}')
    return file


def _handle_error(message):
    """Mancanza di dati o errore durante l'upload."""
    flash(message)
    current_app.logger.error(message)
    return redirect(request.url)

@app.route('/track/<file>/name')
def track_name(file):
    track = Track.query.filter(Track.local_name == file).first()
    return jsonify( {'name':track.name})


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
        user_id=current_user.id if not current_user.is_anonymous else _getAnonymous().id,
        track_id = track.id
        )
        db.session.add(region)
        db.session.commit()

    #TODO save json data as Section
    #TODO save section comments
    return jsonify( region.to_dict() ), 200


@app.route('/track/<file>/description', methods=['GET'])
def track_description_load(file):
    track = Track.query.filter(Track.local_name == file).first()   
    comment = Comment.query.filter( (Comment.track_id == track.id)).first()       
    if comment:
        return jsonify( comment.to_dict() ), 200
    else:
        return 'no data', 404

#TODO decide to check if only the track owner can change the description
@app.route('/track/<file>/description', methods=['POST'])
def track_description_save(file):
    current_app.logger.info(request.json)
    track = Track.query.filter(Track.local_name == file).first()   
    comment = Comment(
        track_id = track.id,
        text = request.json.get('text'),
        user_id=current_user.id if not current_user.is_anonymous else _getAnonymous().id
    ) 
    db.session.add(comment)
    db.session.commit()
    return jsonify( comment.to_dict() ), 200


@app.route('/track/<file>/region/<regionid>/comment/<commentid>', methods=['GET'])
def track_region_comment(file, regionid, commentid): #TODO test
    return comment(commentid)

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
    region = Region.query.filter((Region.native_id == regionid) & (Region.track_id == track.id)).first()  
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
        text = request.json.get('text'),
        user_id=current_user.id if not current_user.is_anonymous else _getAnonymous().id
    ) 
    db.session.add(comment)
    db.session.commit()

    current_app.logger.debug(f'comment saved as {comment}')
    return jsonify( comment.to_dict() ), 200

@app.route('/user/<username>/tracks')
def user_tracks_load(username):
    data = []
    user = User.query.filter(User.username == username).first()
    tracks = user.tracks
    for track in tracks:
        data.append( track.to_dict() )
    
    return jsonify( data )

@app.route('/user/<username>/regions')
def user_regions_load(username):
    data = []
    user = User.query.filter(User.username == username).first()
    regions = user.regions
    for region in regions:
        data.append( region.to_dict() )
        
    return jsonify( data )

@app.route('/user/<username>/comments')
def user_comments_load(username):
    data = []
    user = User.query.filter(User.username == username).first()
    comments = user.comments
    for comment in comments:
        data.append( comment.to_dict() )
        
    return jsonify( data )