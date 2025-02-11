import os
from flask import current_app

ALLOWED_EXTENSIONS = ["wav", "mp3", "m4a", 'webm']

def allowed_file_ext(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_ext(filename):
    return filename.rsplit(".", 1)[1].lower()

def get_upload_folder_full_path():
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if os.path.isabs(upload_folder):
        return upload_folder
    else:
        #TODO try with root_path o instance_path
        return os.path.abspath(os.path.join( current_app.root_path, upload_folder))
    
    