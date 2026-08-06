from pathlib import Path
import math
import random
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "marketing" / "promo"
FRAME_DIR = OUT_DIR / "frames"
FFMPEG = Path(
    "/tmp/fun-fitness-video-tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
)
WIDTH, HEIGHT = 1080, 1920

NAVY = (10, 7, 35)
PURPLE = (31, 18, 78)
GOLD = (235, 190, 91)
RED = (226, 35, 45)
WHITE = (250, 250, 252)
MUTED = (190, 188, 207)

BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
REGULAR = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(BOLD if bold else REGULAR, size)


def background(seed: int) -> Image.Image:
    random.seed(seed)
    image = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
    pixels = image.load()
    for y in range(HEIGHT):
        t = y / HEIGHT
        for x in range(WIDTH):
            radial = max(0, 1 - math.hypot(x - WIDTH / 2, y - HEIGHT * 0.42) / 900)
            noise = random.randint(-2, 2)
            pixels[x, y] = (
                int(10 + 12 * radial + 7 * t) + noise,
                int(7 + 5 * radial),
                int(35 + 35 * radial + 8 * t) + noise,
            )
    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((90, 390, 990, 1290), fill=(110, 39, 180, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    return Image.alpha_composite(image.convert("RGBA"), glow)


def centered(draw: ImageDraw.ImageDraw, text: str, y: int, text_font, fill=WHITE):
    box = draw.textbbox((0, 0), text, font=text_font)
    draw.text(((WIDTH - (box[2] - box[0])) / 2, y), text, font=text_font, fill=fill)


def brand_pill(draw: ImageDraw.ImageDraw):
    label = "FUN FITNESS GYM"
    label_font = font(30, True)
    box = draw.textbbox((0, 0), label, font=label_font)
    pill_width = box[2] - box[0] + 64
    left = (WIDTH - pill_width) // 2
    draw.rounded_rectangle((left, 105, left + pill_width, 173), 34, fill=(35, 25, 82, 240))
    draw.text((left + 32, 119), label, font=label_font, fill=GOLD)


def paste_logo(image: Image.Image, size: int, y: int):
    logo = Image.open(ROOT / "assets" / "fun-fitness-icon.png").convert("RGB")
    logo = logo.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), size // 5, fill=255)
    image.paste(logo, ((WIDTH - size) // 2, y), mask)


def draw_phone(image: Image.Image, accent, rows):
    draw = ImageDraw.Draw(image)
    left, top, right, bottom = 130, 470, 950, 1390
    draw.rounded_rectangle((left, top, right, bottom), 64, fill=(8, 7, 24), outline=GOLD, width=5)
    draw.rounded_rectangle((left + 24, top + 24, right - 24, bottom - 24), 45, fill=(245, 246, 250))
    draw.rounded_rectangle((425, top + 38, 655, top + 58), 10, fill=(23, 20, 46))
    draw.ellipse((185, top + 98, 245, top + 158), fill=accent)
    draw.text((270, top + 102), "Fun Fitness Gym", font=font(30, True), fill=(23, 28, 45))
    y = top + 210
    for title, subtitle, value in rows:
        draw.rounded_rectangle((180, y, 900, y + 160), 28, fill=(255, 255, 255), outline=(224, 226, 235), width=3)
        draw.rounded_rectangle((210, y + 30, 278, y + 98), 20, fill=accent)
        draw.text((310, y + 27), title, font=font(29, True), fill=(28, 31, 48))
        draw.text((310, y + 78), subtitle, font=font(24), fill=(102, 106, 124))
        if value:
            value_box = draw.textbbox((0, 0), value, font=font(27, True))
            draw.text((855 - value_box[2], y + 58), value, font=font(27, True), fill=accent)
        y += 190


def feature_slide(index: int, eyebrow: str, title: str, subtitle: str, accent, rows):
    image = background(index)
    draw = ImageDraw.Draw(image)
    brand_pill(draw)
    centered(draw, eyebrow.upper(), 245, font(29, True), GOLD)
    centered(draw, title, 300, font(62, True))
    centered(draw, subtitle, 390, font(31), MUTED)
    draw_phone(image, accent, rows)
    centered(draw, "Simple tools. More time for your members.", 1515, font(30), MUTED)
    draw.rounded_rectangle((315, 1610, 765, 1702), 46, fill=accent)
    centered(draw, "COMING SOON", 1628, font(34, True), WHITE)
    return image.convert("RGB")


def make_slides():
    FRAME_DIR.mkdir(parents=True, exist_ok=True)

    opening = background(1)
    draw = ImageDraw.Draw(opening)
    paste_logo(opening, 650, 340)
    centered(draw, "YOUR GYM.", 1070, font(76, True), WHITE)
    centered(draw, "SMARTER.", 1160, font(76, True), GOLD)
    centered(draw, "A simpler way to manage fitness.", 1300, font(34), MUTED)
    opening.convert("RGB").save(FRAME_DIR / "01-opening.jpg", quality=95)

    slides = [
        feature_slide(
            2,
            "Know your community",
            "Manage Members",
            "Profiles and measurements in one place",
            RED,
            [("Active members", "Your growing gym community", "128"), ("Member details", "Phone, goal and joining date", "VIEW"), ("Measurements", "Simple history for every member", "+ ADD")],
        ),
        feature_slide(
            3,
            "Plan every session",
            "Assign Workouts",
            "Build a clear workout for today",
            (206, 150, 40),
            [("Compound 1", "6 exercises", "ASSIGN"), ("Bench Press", "3 sets × 10 reps", "30 KG"), ("Lat Pulldown", "3 sets × 12 reps", "25 KG")],
        ),
        feature_slide(
            4,
            "Keep members moving",
            "Track Completion",
            "Members follow exercises in saved order",
            (28, 154, 104),
            [("Running", "5 minutes", "DONE"), ("Bench Press", "3 sets × 10 reps", "DONE"), ("Crunches", "3 sets × 20 reps", "NEXT")],
        ),
        feature_slide(
            5,
            "See steady progress",
            "Record Measurements",
            "Simple weight and measurement history",
            (77, 91, 202),
            [("Weight", "Latest measurement", "74 KG"), ("Chest", "Latest measurement", "98 CM"), ("Waist", "Latest measurement", "84 CM")],
        ),
    ]
    for number, slide in enumerate(slides, start=2):
        slide.save(FRAME_DIR / f"0{number}-feature.jpg", quality=95)

    closing = background(6)
    draw = ImageDraw.Draw(closing)
    paste_logo(closing, 500, 290)
    centered(draw, "BUILT FOR TRAINERS.", 900, font(55, True), WHITE)
    centered(draw, "SIMPLE FOR MEMBERS.", 980, font(55, True), GOLD)
    draw.rounded_rectangle((280, 1150, 800, 1265), 58, fill=RED)
    centered(draw, "COMING SOON", 1176, font(40, True), WHITE)
    centered(draw, "Fun Fitness Gym", 1370, font(43, True), WHITE)
    centered(draw, "Stronger routines start here.", 1435, font(30), MUTED)
    closing.convert("RGB").save(FRAME_DIR / "06-closing.jpg", quality=95)


def render_video():
    inputs = []
    for frame in sorted(FRAME_DIR.glob("*.jpg")):
        inputs.extend(["-loop", "1", "-t", "3", "-i", str(frame)])

    filters = []
    for i in range(6):
        filters.append(
            f"[{i}:v]fps=30,format=yuv420p,setsar=1,"
            f"fade=t=in:st=0:d=0.22,fade=t=out:st=2.78:d=0.22[v{i}]"
        )
    filters.append(
        "[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0[vout]"
    )
    output = OUT_DIR / "fun-fitness-gym-coming-soon.mp4"
    command = [
        str(FFMPEG), "-y", *inputs,
        "-f", "lavfi", "-t", "18", "-i",
        "sine=frequency=110:sample_rate=44100,volume=0.035",
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-map", "6:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        "-shortest", str(output),
    ]
    subprocess.run(command, check=True)
    print(output)


if __name__ == "__main__":
    make_slides()
    render_video()
