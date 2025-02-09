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
from werkzeug.utils import secure_filename
from models.conn import db
from models.models import Track, Region, Comment

from modules.filechecker import allowed_file_ext

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
    # TODO check return as track is not used in the template anymore
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
    file = None
    local_filename = None
    try:
        if request.files:
            file = _handle_file_track_upload(request)
        elif request.json:
            file = _handle_json_track_upload(request)
        else:
            return _handle_error('No file part')        
        (filename, local_filename) = _save_file(file)
        _save_track(filename, local_filename)

        if request.files:
            return redirect(url_for('default.play', file=local_filename))
        elif request.json:
            response = {'url':url_for('default.play', file=local_filename)}
            return jsonify(response)
        
    except Exception as e:
        current_app.logger.exception(f'Error saving file {file} as {local_filename}')
        return _handle_error('Error saving track')

def _save_file(file):
    # Salvataggio del file sul disco
    filename = secure_filename(file.filename)
    local_filename = uuid.uuid4().hex
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], local_filename)
    file.save(filepath)
    current_app.logger.info(f'file {filename} saved as {local_filename}')
    return (filename, local_filename)

def _save_track(filename, local_filename):
    # salvataggio come record
    track = Track(
        name=filename,
        local_name=local_filename
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
    #BUG the content of the track stream is "[object Promise]"
    import io
    import base64
    from werkzeug.datastructures import FileStorage

    current_app.logger.debug(f'request json: {request.json}')
    file = FileStorage(
        stream=io.BytesIO(  base64.b64decode(request.json.get('track')) ),
        filename=request.json.get('name'),
        content_type=request.json.get('type'),
        name='file'
    )
    current_app.logger.debug(f'file: {file}')
    return file
    # from werkzeug.datastructures import TemporaryUploadedFile

    # filename = request.json.get('filename')
    # file_data = request.json.get('track')
    # # Costruisci il file in formato bytes
    # with io.BytesIO(file_data) as buffer:
    #     buffer.seek(0)
    #     file_obj = TemporaryUploadedFile(
    #         filename=secure_filename(filename),
    #         content_type="text/plain",
    #         headers={f"Content-Disposition": "attachment;filename={filename}"},
    #         charset="utf-8"
    #     )
    return file_obj


def _handle_error(message):
    """Mancanza di dati o errore durante l'upload."""
    flash(message)
    current_app.logger.error(message)
    return redirect(request.url)

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
    return jsonify( region.to_dict() ), 200


@app.route('/track/<file>/description', methods=['GET'])
def track_description_load(file):
    track = Track.query.filter(Track.local_name == file).first()   
    comment = Comment.query.filter( (Comment.track_id == track.id)).first()       
    if comment:
        return jsonify( comment.to_dict() ), 200
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
    return jsonify( comment.to_dict() ), 200


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
        text = request.json.get('text')
    ) 
    db.session.add(comment)
    db.session.commit()

    current_app.logger.debug(f'comment saved as {comment}')
    return jsonify( comment.to_dict() ), 200