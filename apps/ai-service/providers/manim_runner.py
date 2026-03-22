import os
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

RENDER_TIMEOUT = 120
FFMPEG_TIMEOUT = 60
DOCKER_SOCKET = "/var/run/docker.sock"


class ManimRunner:

    def __init__(self):
        self.container = settings.MANIM_CONTAINER_NAME
        self.media_path = settings.MEDIA_STORAGE_PATH
        self._last_error: str | None = None

    async def render_scene(self, scene_code: str, node_id: str) -> str | None:
        video_dir = os.path.join(self.media_path, "video")
        os.makedirs(video_dir, exist_ok=True)

        scene_file = os.path.join(video_dir, f"{node_id}_scene.py")
        with open(scene_file, "w") as f:
            f.write(scene_code)

        output_name = f"{node_id}_silent.mp4"
        cmd = [
            "manim", "render",
            "-qm",
            "--media_dir", "/media/video/manim_output",
            "-o", output_name,
            f"/media/video/{node_id}_scene.py",
            "GeneratedScene",
        ]

        logger.info(f"Rendering Manim scene for {node_id}...")
        exit_code, output = await self._docker_exec(cmd, timeout=RENDER_TIMEOUT)

        if exit_code != 0:
            # Extract the last few lines as the error message for retry context
            error_lines = output.strip().split("\n")
            self._last_error = "\n".join(error_lines[-10:])
            logger.error(f"Manim render failed (exit {exit_code}):\n{self._last_error}")
            return None

        self._last_error = None
        logger.info(f"Manim render succeeded")

        # Find the output file
        output_path = self._find_rendered_file(
            os.path.join(video_dir, "manim_output"), output_name
        )
        if output_path:
            return output_path

        logger.error("Rendered file not found in manim output directory")
        return None

    async def get_last_error(self) -> str | None:
        return self._last_error

    async def burn_subtitles(self, video_path: str, subtitle_path: str, output_path: str) -> bool:
        """Burn ASS subtitles into a video that already has audio."""
        container_video = self._to_container_path(video_path)
        container_sub = self._to_container_path(subtitle_path)
        container_output = self._to_container_path(output_path)

        cmd = [
            "ffmpeg", "-y",
            "-i", container_video,
            "-vf", f"ass={container_sub}",
            "-c:v", "libx264",
            "-c:a", "copy",
            container_output,
        ]

        logger.info("FFmpeg burning subtitles...")
        exit_code, output = await self._docker_exec(cmd, timeout=FFMPEG_TIMEOUT)

        if exit_code != 0:
            logger.error(f"FFmpeg subtitle burn failed (exit {exit_code}):\n{output}")
            return False

        logger.info("FFmpeg subtitle burn succeeded")
        return True

    async def merge_audio_video(
        self, video_path: str, audio_path: str, output_path: str, subtitle_path: str | None = None
    ) -> bool:
        container_video = self._to_container_path(video_path)
        container_audio = self._to_container_path(audio_path)
        container_output = self._to_container_path(output_path)

        if subtitle_path:
            container_sub = self._to_container_path(subtitle_path)
            # ASS subtitles — burn in with bottom positioning
            cmd = [
                "ffmpeg", "-y",
                "-i", container_video,
                "-i", container_audio,
                "-vf", f"ass={container_sub}",
                "-c:v", "libx264",
                "-c:a", "aac",
                "-map", "0:v", "-map", "1:a",
                container_output,
            ]
        else:
            cmd = [
                "ffmpeg", "-y",
                "-i", container_video,
                "-i", container_audio,
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v", "-map", "1:a",
                container_output,
            ]

        logger.info(f"FFmpeg merging audio + video...")
        exit_code, output = await self._docker_exec(cmd, timeout=FFMPEG_TIMEOUT)

        if exit_code != 0:
            logger.error(f"FFmpeg merge failed (exit {exit_code}):\n{output}")
            return False

        logger.info("FFmpeg merge succeeded")
        return True

    async def _docker_exec(self, cmd: list[str], timeout: int = 120) -> tuple[int, str]:
        transport = httpx.AsyncHTTPTransport(uds=DOCKER_SOCKET)
        async with httpx.AsyncClient(transport=transport, base_url="http://docker") as client:
            # Create exec instance
            create_resp = await client.post(
                f"/containers/{self.container}/exec",
                json={
                    "Cmd": cmd,
                    "AttachStdout": True,
                    "AttachStderr": True,
                },
            )
            create_resp.raise_for_status()
            exec_id = create_resp.json()["Id"]

            # Start exec
            start_resp = await client.post(
                f"/exec/{exec_id}/start",
                json={"Detach": False},
                timeout=timeout,
            )
            start_resp.raise_for_status()
            output = start_resp.text

            # Inspect exec for exit code
            inspect_resp = await client.get(f"/exec/{exec_id}/json")
            inspect_resp.raise_for_status()
            exit_code = inspect_resp.json().get("ExitCode", -1)

            return exit_code, output

    def _to_container_path(self, host_path: str) -> str:
        media_base = os.path.abspath(self.media_path)
        abs_path = os.path.abspath(host_path)
        rel = os.path.relpath(abs_path, media_base)
        return f"/media/{rel}"

    def _find_rendered_file(self, search_dir: str, filename: str) -> str | None:
        for root, _, files in os.walk(search_dir):
            if filename in files:
                return os.path.join(root, filename)
        return None


def get_manim_runner() -> ManimRunner:
    return ManimRunner()
