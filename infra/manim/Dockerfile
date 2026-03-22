FROM manimcommunity/manim:stable
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install "setuptools<70" manim-voiceover
USER manimuser
