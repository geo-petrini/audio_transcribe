import ffmpeg
from flask import current_app

def convert(inputfilename, outputfilename):
    command = f' -loglevel error -i "{inputfilename}" -vn -ab 128k -ar 44100 -y -o "{outputfilename}"'
    command.strip()
    current_app.logger.debug(r'conversion command: {command}')
    return ffmpeg.run_as_ffmpeg(command)
        