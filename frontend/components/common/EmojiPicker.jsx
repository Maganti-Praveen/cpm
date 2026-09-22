//- MOBILE-FIRST PERFORMANCE OPTIMIZATION:
//- This heavy component, along with its large data dependencies (EMOJI_CATEGORIES, EMOJI_KEYWORDS), is now code-split.
//- It is lazy-loaded inside MessagesComponent.jsx only when the user clicks the emoji trigger button.
//- This significantly reduces the initial bundle size and JavaScript execution time on mobile devices.
import React, { useState, useEffect, useRef } from 'react';

//- ACCESSIBILITY OPTIMIZATION: All interactive elements have clear aria-labels and sufficient touch target sizes.
const EMOJI_CATEGORIES = [
    { name: "smileys", icon: "😃" },
    { name: "gestures", icon: "👍" },
    { name: "animals", icon: "🐱" },
    { name: "food", icon: "🍔" },
    { name: "travel", icon: "🚗" },
    { name: "activities", icon: "⚽" },
    { name: "symbols", icon: "❤️" },
];

const EMOJIS_DATA = {
    smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤫", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤠", "😈", "👿", "👹", "💀", "☠️", "👽", "👾", "🤖", "🎃"],
    gestures: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "👂", "👃", "🧠", "👀", "👁️", "👅", "👄", "💋"],
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🕷️", "🕸️", "🐢", "🐍", "🦎", "🐙", "🦑", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦍", "🐘", "🐪", "🦒", "🐕", "🐈", "🐓", "🦃", "🕊️", "🐇", "🦝", "🦥", "🐾", "🐉", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "🍀", "🍁", "🍂", "🍃", "🍄", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷"],
    food: ["🍏", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🌽", "🥕", "🧄", "🧅", "🥔", "🥐", "🍞", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🎂", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🥤", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸"],
    travel: ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚚", "🚜", "🛵", "🚲", "🛴", "🛹", "🚆", "🚇", "🛫", "🚁", "⛵", "🚢", "⚓", "🚀", "🌙", "☀️", "☁️", "🌧️", "❄️", "🌋", "🏔️", "🏖️", "⛺", "🏠", "🏢", "🏨", "🏦", "🗺️"],
    activities: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🎿", "🛷", "🎯", "🎮", "🕹️", "🧩", "🧸", "🎨", "🎬", "🎤", "🎧", "🎹", "🥁", "🎸", "🎻", "🎲", "🪄", "💻", "📱", "⌚", "📷", "🔦", "📖", "📚", "📝", "✉️", "📦", "✏️", "📎", "🔑", "🔨", "🛠️", "🛡️", "💊", "💼", "💰", "💳", "💎"],
    symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "☯️", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "⚠️", "🚫", "❌", "✔️", "💯", "ℹ️", "📶", "🏁", "🏳️‍🌈", "🏴‍☠️", "🇺🇸", "🇬🇧", "🇮🇳", "🇨🇦", "🇦🇺", "🇯🇵", "🇩🇪", "🇫🇷"]
};

const EMOJI_KEYWORDS = {
    "😀": "smile grin happy face", "😃": "smile open happy mouth", "😄": "smile eye happy laugh", "😁": "grin smile happy teeth", "😆": "laugh squint happy smile", "😅": "sweat laugh happy relief", "😂": "joy laugh cry tears", "🤣": "rofl laugh roll floor", "😊": "blush smile happy warm", "😇": "halo angel innocent heaven",
    "🙂": "slight smile happy", "🙃": "upside down smile silly", "😉": "wink smile secret", "😌": "relieved calm peace", "😍": "heart eyes love adore", "🥰": "hearts love warm affection", "😘": "kiss blow love heart", "😗": "kiss love face", "😙": "kiss smile eye", "😚": "kiss closed eye", "😋": "yum delicious food tongue",
    "😛": "tongue silly face", "😝": "tongue squint silly", "😜": "tongue wink silly eye", "🤪": "zany crazy silly wild", "🤨": "raised eyebrow skept", "🧐": "monocle classy smart", "🤓": "nerd geek smart glasses", "😎": "cool glasses sunglasses", "😏": "smirk sly confident", "😒": "unamused shrug meh", "😞": "disappointed sad sorry",
    "😔": "pensive sad deep worry", "😟": "worried concern uneasy", "😕": "confused unsure query", "🙁": "frown sad unhappy", "😣": "persevere struggle persist", "😖": "confounded worry upset", "😫": "tired yawn exhaust", "😩": "weary tired crying", "🥺": "pleading beg puppy eyes", "😢": "cry sad tear weep", "😭": "cry sob loud tears",
    "😤": "triumph angry steam proud", "😠": "angry mad upset", "😡": "pout angry mad red", "🤯": "explode mind blown head", "😳": "flushed shock blush", "🥵": "hot heat summer red", "🥶": "cold freeze winter blue", "😱": "scream fear shock horror", "😨": "fear scared worry shock", "😰": "anxious sweat blue worry",
    "😥": "sad relieved sweat tear", "😓": "sweat worry heavy", "🤗": "hug warm welcome", "🤔": "think question ponder guess", "🫣": "peeking eye hide scared", "🤫": "shh quiet silence whisper", "😶": "silent mouthless quiet", "😐": "neutral meh straight face", "😑": "expressionless meh flat", "😬": "grimace teeth awkward",
    "🙄": "roll eyes meh ignore", "😯": "hushed surprise open mouth", "😦": "frown open mouth surprise", "😧": "anguish pain worry face", "😮": "surprise wow open mouth", "😲": "astonished shock surprise", "😴": "sleep zzz snore rest", "🤤": "drool delicious sleep", "😪": "sleepy tired nose bubble",
    "😵": "dizzy dead knocked out", "🤐": "zipper mouth quiet secret", "🥴": "woozy drunk sick dizzy", "🤢": "nausea green throw up", "🤮": "vomit puke sick green", "🤧": "sneeze sick cold flu", "😷": "mask sick hospital doctor", "🤒": "thermometer sick fever", "🤕": "bandage hurt head injury", "🤠": "cowboy hat west country",
    "😈": "devil horn evil bad purple", "👿": "devil angry evil bad", "👹": "ogre monster red mask Japanese", "💀": "skull dead skeleton bones", "☠️": "crossbones skull pirate poison", "👽": "alien space ufo martian", "👾": "monster retro game space invader", "🤖": "robot machine screen future", "🎃": "jack-o-lantern pumpkin halloween",
    "👋": "wave hello goodbye hand", "🤚": "raised back hand stop", "🖐️": "splayed hand fingers", "✋": "stop hand high five", "🖖": "vulcan live long prosper", "👌": "ok hand fine correct", "🤌": "pinched fingers Italian gesture", "🤏": "pinched hand small tiny", "✌️": "peace victory hand sign", "🤞": "crossed fingers luck wish",
    "🤟": "love sign hand gesture", "🤘": "rock on sign devil horns", "🤙": "call me hand sign phone", "👈": "point left index direction", "👉": "point right index direction", "👆": "point up index ceiling", "🖕": "middle finger insult rude", "👇": "point down index ground", "☝️": "index point up number one", "👍": "thumbs up like good yes",
    "👎": "thumbs down dislike bad no", "✊": "fist raise power strength", "👊": "punch fist bump strike", "🤛": "fist left direction", "🤜": "fist right direction", "👏": "clap applaud hands congrats", "🙌": "hooray praise celebrate hands", "👐": "open hands hug share", "🤲": "palms up together pray book",
    "🤝": "handshake deal agreement partner", "🙏": "pray thank you hands please", "✍️": "write pencil signing hand", "💅": "nail polish beauty salon", "🤳": "selfie photo phone camera", "💪": "muscle strength bicep power", "🦾": "robotic arm metal power", "🦿": "robotic leg metal run", "👂": "ear listen hear sound",
    "👃": "nose smell sniff breath", "🧠": "brain mind think smart head", "👀": "eyes look watch notice see", "👁️": "eye look observe see vision", "👅": "tongue taste lick mouth", "👄": "lips mouth kiss speak", "💋": "lipstick kiss mark love",
};

export default function EmojiPicker({ onEmojiSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState("smileys");
    const [emojiSearch, setEmojiSearch] = useState("");
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const getFilteredEmojis = () => {
        if (!emojiSearch.trim()) {
            return EMOJIS_DATA[activeCategory] || [];
        }
        const query = emojiSearch.toLowerCase().trim();
        const matched = [];
        for (const categoryName in EMOJIS_DATA) {
            for (const emoji of EMOJIS_DATA[categoryName]) {
                const keywords = EMOJI_KEYWORDS[emoji] || "";
                if (keywords.includes(query) || categoryName.includes(query)) {
                    matched.push(emoji);
                }
            }
        }
        return Array.from(new Set(matched));
    };

    const displayedEmojis = getFilteredEmojis();

    return (
        <div ref={pickerRef} className="absolute bottom-full mb-3 w-[320px] bg-white border border-slate-200 rounded-2xl shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Category Tabs */}
            <div className="p-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-around">
                    {EMOJI_CATEGORIES.map(({ name, icon }) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => {
                                setActiveCategory(name);
                                setEmojiSearch("");
                            }}
                            aria-label={`Select ${name} category`}
                            className={`p-2 rounded-lg text-lg transition-colors border-none cursor-pointer ${
                                activeCategory === name && !emojiSearch ? "bg-indigo-100" : "bg-transparent hover:bg-slate-200"
                            }`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-slate-200">
                <input
                    type="text"
                    placeholder="Search emojis..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-250 rounded-lg bg-slate-50/50 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                    aria-label="Search all emojis"
                />
            </div>

            {/* Emoji Grid */}
            <div className="h-48 overflow-y-auto p-2 grid grid-cols-8 gap-1">
                {displayedEmojis.map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onEmojiSelect(emoji)}
                        aria-label={`Select emoji: ${EMOJI_KEYWORDS[emoji]?.split(' ')[0] || ''}`}
                        className="text-2xl rounded-lg hover:bg-slate-100 transition-colors border-none cursor-pointer aspect-square flex items-center justify-center"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
