ALLOWED_EXTENSIONS = ["wav", "mp3", "m4a", 'webm']

def allowed_file_ext(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_ext(filename):
    return filename.rsplit(".", 1)[1].lower()
