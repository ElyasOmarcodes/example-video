"""The two characters of the Nahzat episode. Generic, story-driven designs (not portraits):
a US president of 2001 and a Pakistani four-star general of 2001.
MakeHuman macro values: age 0.5 = 25 y, 1.0 = 90 y; height 0.5 = average for that age/gender."""

PRESIDENT = dict(
    id='president',
    label_ps='ولسمشر',
    macro=dict(gender=1.0, age=0.735, muscle=0.5, weight=0.52, proportions=0.8, height=0.572,
               race={'caucasian': 1.0, 'asian': 0.0, 'african': 0.0}),
    details={
        'head/head-oval': 0.35, 'head/head-rectangular': 0.25, 'head/head-scale-vert': 0.08,
        'forehead/forehead-temple': 0.25, 'forehead/forehead-scale-vert': 0.15,
        'eyebrows/eyebrows-angle': -0.35, 'eyebrows/eyebrows-trans': -0.15,
        'eyes/l-eye-height2': -0.18, 'eyes/r-eye-height2': -0.18,
        'eyes/l-eye-bag': 0.45, 'eyes/r-eye-bag': 0.45,
        'eyes/l-eye-scale': -0.15, 'eyes/r-eye-scale': -0.15,
        'eyes/l-eye-eyefold-angle': -0.2, 'eyes/r-eye-eyefold-angle': -0.2,
        'nose/nose-scale-vert': 0.22, 'nose/nose-point-width': 0.2, 'nose/nose-hump': 0.12, 'nose/nose-width2': 0.1,
        'mouth/mouth-scale-horiz': 0.28, 'mouth/mouth-upperlip-volume': -0.45, 'mouth/mouth-lowerlip-volume': -0.3,
        'mouth/mouth-angles': -0.12, 'mouth/mouth-laugh-lines': 0.4,
        'chin/chin-prominent': 0.2, 'chin/chin-width': 0.2, 'chin/chin-height': 0.1,
        'ears/l-ear-scale': 0.25, 'ears/r-ear-scale': 0.25, 'ears/l-ear-flap': 0.2, 'ears/r-ear-flap': 0.2,
        'cheek/l-cheek-bones': 0.1, 'cheek/r-cheek-bones': 0.1,
        'neck/neck-scale-horiz': 0.08,
    },
    skin=dict(srgb=(0.86, 0.66, 0.56), sss_radius=(1.0, 0.35, 0.2), redness=0.4, age=0.55),
    iris='iris_blue', hair=dict(style='side_part', melanin=0.74, gray=0.62, length=0.042),
    eyebrow_color=(0.38, 0.34, 0.30), mustache=False, scalp_tint=(0.16, 0.145, 0.13),
)

GENERAL = dict(
    id='general',
    label_ps='جنرال',
    macro=dict(gender=1.0, age=0.76, muscle=0.5, weight=0.62, proportions=0.65, height=0.485,
               race={'caucasian': 0.95, 'asian': 0.0, 'african': 0.05}),
    details={
        'head/head-round': 0.4, 'head/head-fat': 0.2, 'head/head-scale-horiz': 0.06,
        'forehead/forehead-scale-vert': -0.1, 'forehead/forehead-nubian': 0.15,
        'eyebrows/eyebrows-trans': -0.2, 'eyebrows/eyebrows-angle': 0.1,
        'eyes/l-eye-bag': 0.5, 'eyes/r-eye-bag': 0.5, 'eyes/l-eye-eyefold': 0.1, 'eyes/r-eye-eyefold': 0.1, 'eyes/l-eye-push1': 0.15, 'eyes/r-eye-push1': 0.15,
        'eyes/l-eye-scale': -0.05, 'eyes/r-eye-scale': -0.05,
        'nose/nose-scale-depth': 0.32, 'nose/nose-volume': 0.22, 'nose/nose-hump': 0.32, 'nose/nose-width1': 0.12, 'nose/nose-scale-vert': 0.12,
        'nose/nose-point': -0.15, 'nose/nose-flaring': 0.2,
        'mouth/mouth-scale-horiz': -0.05, 'mouth/mouth-lowerlip-volume': 0.15, 'mouth/mouth-laugh-lines': 0.45,
        'cheek/l-cheek-volume': 0.3, 'cheek/r-cheek-volume': 0.3, 'cheek/l-cheek-trans': -0.15, 'cheek/r-cheek-trans': -0.15,
        'chin/chin-jaw-drop': 0.12, 'chin/chin-width': 0.15,
        'neck/neck-double': 0.25, 'neck/neck-scale-horiz': 0.12,
        'stomach/stomach-pregnant': 0.12,
    },
    skin=dict(srgb=(0.69, 0.49, 0.37), sss_radius=(0.9, 0.35, 0.2), redness=0.15, age=0.6),
    iris='iris_brown', hair=dict(style='short_cap', melanin=0.9, gray=0.3, length=0.02),
    eyebrow_color=(0.10, 0.09, 0.085), mustache=True, scalp_tint=(0.035, 0.03, 0.027),
)

CHARACTERS = {c['id']: c for c in (PRESIDENT, GENERAL)}

EXPRESSIONS = ['eye-left-closure', 'eye-right-closure', 'mouth-open', 'mouth-corner-puller', 'mouth-compression',
               'eyebrows-left-up', 'eyebrows-right-up', 'eyebrows-left-down', 'eyebrows-right-down', 'mouth-depression']
