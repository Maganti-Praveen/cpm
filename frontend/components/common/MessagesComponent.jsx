// Unified direct message chat workspace component connecting portal users.
// Provides a responsive two-column interface with user search, feed polling, and bubble custom styling.
// Upgraded to support media attachments, emoji picker search, and WhatsApp-style reaction menus.

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  Search, 
  Send, 
  MessageSquare, 
  ArrowLeft, 
  Loader2, 
  Circle,
  Trash2,
  MoreVertical,
  Square,
  CheckSquare,
  X,
  Check,
  Smile, 
  Paperclip,
  Eye,
  ArrowDown,
  Users,
  Info,
  LogOut,
  Plus,
  UserPlus,
  Settings,
  Edit,
  Archive,
  Pin,
  Lock,
  Unlock,
  KeyRound
} from "lucide-react";
import Avatar from "./Avatar";
import { useToast } from "../../context/ToastContext";
import * as messageService from "../../services/messageService";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const DELETE_LIMIT_MINUTES = 15; // Configuration variable for deletion time limit (in minutes)

const EMOJI_CATEGORIES = [
  {
    name: "smileys",
    icon: "😃",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤫", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤠", "😈", "👿", "👹", "💀", "☠️", "👽", "👾", "🤖", "🎃"]
  },
  {
    name: "gestures",
    icon: "👍",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "👂", "👃", "🧠", "👀", "👁️", "👅", "👄", "💋"]
  },
  {
    name: "animals",
    icon: "🐱",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🕷️", "🕸️", "🐢", "🐍", "🦎", "🐙", "🦑", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦍", "🐘", "🐪", "🦒", "🐕", "🐈", "🐓", "🦃", "🕊️", "🐇", "🦝", "🦥", "🐾", "🐉", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "🍀", "🍁", "🍂", "🍃", "🍄", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷"]
  },
  {
    name: "food",
    icon: "🍔",
    emojis: ["🍏", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🌽", "🥕", "🧄", "🧅", "🥔", "🥐", "🍞", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🎂", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🥤", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸"]
  },
  {
    name: "travel",
    icon: "🚗",
    emojis: ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚚", "🚜", "🛵", "🚲", "🛴", "🛹", "🚆", "🚇", "🛫", "🚁", "⛵", "🚢", "⚓", "🚀", "🌙", "☀️", "☁️", "🌧️", "❄️", "🌋", "🏔️", "🏖️", "⛺", "🏠", "🏢", "🏨", "🏦", "🗺️"]
  },
  {
    name: "activities",
    icon: "⚽",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🎿", "🛷", "🎯", "🎮", "🕹️", "🧩", "🧸", "🎨", "🎬", "🎤", "🎧", "🎹", "🥁", "🎸", "🎻", "🎲", "🪄", "💻", "📱", "⌚", "📷", "🔦", "📖", "📚", "📝", "✉️", "📦", "✏️", "📎", "🔑", "🔨", "🛠️", "🛡️", "💊", "💼", "💰", "💳", "💎"]
  },
  {
    name: "symbols",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "☯️", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "⚠️", "🚫", "❌", "✔️", "💯", "ℹ️", "📶", "🏁", "🏳️‍🌈", "🏴‍☠️", "🇺🇸", "🇬🇧", "🇮🇳", "🇨🇦", "🇦🇺", "🇯🇵", "🇩🇪", "🇫🇷"]
  }
];

const EMOJI_KEYWORDS = {
  "😀": "smile grin happy face",
  "😃": "smile open happy mouth",
  "😄": "smile eye happy laugh",
  "😁": "grin smile happy teeth",
  "😆": "laugh squint happy smile",
  "😅": "sweat laugh happy relief",
  "😂": "joy laugh cry tears",
  "🤣": "rofl laugh roll floor",
  "😊": "blush smile happy warm",
  "😇": "halo angel innocent heaven",
  "🙂": "slight smile happy",
  "🙃": "upside down smile silly",
  "😉": "wink smile secret",
  "😌": "relieved calm peace",
  "😍": "heart eyes love adore",
  "🥰": "hearts love warm affection",
  "😘": "kiss blow love heart",
  "😗": "kiss love face",
  "😙": "kiss smile eye",
  "😚": "kiss closed eye",
  "😋": "yum delicious food tongue",
  "😛": "tongue silly face",
  "😝": "tongue squint silly",
  "😜": "tongue wink silly eye",
  "🤪": "zany crazy silly wild",
  "🤨": "raised eyebrow skept",
  "🧐": "monocle classy smart",
  "🤓": "nerd geek smart glasses",
  "😎": "cool glasses sunglasses",
  "😏": "smirk sly confident",
  "😒": "unamused shrug meh",
  "😞": "disappointed sad sorry",
  "😔": "pensive sad deep worry",
  "😟": "worried concern uneasy",
  "😕": "confused unsure query",
  "🙁": "frown sad unhappy",
  "😣": "persevere struggle persist",
  "😖": "confounded worry upset",
  "😫": "tired yawn exhaust",
  "😩": "weary tired crying",
  "🥺": "pleading beg puppy eyes",
  "😢": "cry sad tear weep",
  "😭": "cry sob loud tears",
  "😤": "triumph angry steam proud",
  "😠": "angry mad upset",
  "😡": "pout angry mad red",
  "🤯": "explode mind blown head",
  "😳": "flushed shock blush",
  "🥵": "hot heat summer red",
  "🥶": "cold freeze winter blue",
  "😱": "scream fear shock horror",
  "😨": "fear scared worry shock",
  "😰": "anxious sweat blue worry",
  "😥": "sad relieved sweat tear",
  "😓": "sweat worry heavy",
  "🤗": "hug warm welcome",
  "🤔": "think question ponder guess",
  "🫣": "peeking eye hide scared",
  "🤫": "shh quiet silence whisper",
  "😶": "silent mouthless quiet",
  "😐": "neutral meh straight face",
  "😑": "expressionless meh flat",
  "😬": "grimace teeth awkward",
  "🙄": "roll eyes meh ignore",
  "😯": "hushed surprise open mouth",
  "😦": "frown open mouth surprise",
  "😧": "anguish pain worry face",
  "😮": "surprise wow open mouth",
  "😲": "astonished shock surprise",
  "😴": "sleep zzz snore rest",
  "🤤": "drool delicious sleep",
  "😪": "sleepy tired nose bubble",
  "😵": "dizzy dead knocked out",
  "🤐": "zipper mouth quiet secret",
  "🥴": "woozy drunk sick dizzy",
  "🤢": "nausea green throw up",
  "🤮": "vomit puke sick green",
  "🤧": "sneeze sick cold flu",
  "😷": "mask sick hospital doctor",
  "🤒": "thermometer sick fever",
  "🤕": "bandage hurt head injury",
  "🤠": "cowboy hat west country",
  "😈": "devil horn evil bad purple",
  "👿": "devil angry evil bad",
  "👹": "ogre monster red mask Japanese",
  "💀": "skull dead skeleton bones",
  "☠️": "crossbones skull pirate poison",
  "👽": "alien space ufo martian",
  "👾": "monster retro game space invader",
  "🤖": "robot machine screen future",
  "🎃": "jack-o-lantern pumpkin halloween",
  "👋": "wave hello goodbye hand",
  "🤚": "raised back hand stop",
  "🖐️": "splayed hand fingers",
  "✋": "stop hand high five",
  "🖖": "vulcan live long prosper",
  "👌": "ok hand fine correct",
  "🤌": "pinched fingers Italian gesture",
  "🤏": "pinched hand small tiny",
  "✌️": "peace victory hand sign",
  "🤞": "crossed fingers luck wish",
  "🤟": "love sign hand gesture",
  "🤘": "rock on sign devil horns",
  "🤙": "call me hand sign phone",
  "👈": "point left index direction",
  "👉": "point right index direction",
  "👆": "point up index ceiling",
  "🖕": "middle finger insult rude",
  "👇": "point down index ground",
  "☝️": "index point up number one",
  "👍": "thumbs up like good yes",
  "👎": "thumbs down dislike bad no",
  "✊": "fist raise power strength",
  "👊": "punch fist bump strike",
  "🤛": "fist left direction",
  "🤜": "fist right direction",
  "👏": "clap applaud hands congrats",
  "🙌": "hooray praise celebrate hands",
  "👐": "open hands hug share",
  "🤲": "palms up together pray book",
  "🤝": "handshake deal agreement partner",
  "🙏": "pray thank you hands please",
  "✍️": "write pencil signing hand",
  "💅": "nail polish beauty salon",
  "🤳": "selfie photo phone camera",
  "💪": "muscle strength bicep power",
  "🦾": "robotic arm metal power",
  "🦿": "robotic leg metal run",
  "👂": "ear listen hear sound",
  "👃": "nose smell sniff breath",
  "🧠": "brain mind think smart head",
  "👀": "eyes look watch notice see",
  "👁️": "eye look observe see vision",
  "👅": "tongue taste lick mouth",
  "👄": "lips mouth kiss speak",
  "💋": "lipstick kiss mark love",
  "🐶": "dog puppy pet canine bark",
  "🐱": "cat kitten pet feline meow",
  "🐭": "mouse rat rodent squeak",
  "🐹": "hamster rodent pet cute",
  "🐰": "rabbit bunny pet hops ears",
  "🦊": "fox wild orange tail sly",
  "🐨": "koala bear Australia tree cute",
  "🐯": "tiger cat wild striped orange",
  "🦁": "lion cat king wild mane",
  "🐮": "cow milk farm animal bovine",
  "🐷": "pig farm animal pink pork",
  "🐸": "frog amphibian green jump croak",
  "🐵": "monkey ape banana wild cute",
  "🙈": "see no evil monkey eyes covered",
  "🙉": "hear no evil monkey ears covered",
  "🙊": "speak no evil monkey mouth covered",
  "🐒": "monkey ape climbing tail",
  "🐔": "chicken farm bird rooster hen",
  "🐧": "penguin bird ice snow flyless",
  "🐦": "bird wing fly chirping",
  "🐤": "baby chick yellow bird",
  "🐣": "hatching chick egg bird",
  "🐥": "chick yellow baby bird",
  "🦆": "duck water bird quack lake",
  "🦅": "eagle bird prey fly sky",
  "🦉": "owl bird night wise eyes",
  "🐺": "wolf dog wild forest howl",
  "🐴": "horse farm animal ride gallop",
  "🦄": "unicorn horse magic fantasy horn",
  "🐝": "bee honey insect sting yellow",
  "🐛": "bug caterpillar insect crawl green",
  "🦋": "butterfly insect wings colorful fly",
  "🐌": "snail shell slow crawl slime",
  "🐞": "ladybug insect red spots bug",
  "🐜": "ant insect crawl team work",
  "🕷️": "spider bug insect web eight legs",
  "🕸️": "spiderweb cobweb net trap",
  "🐢": "turtle shell slow green ocean",
  "🐍": "snake reptile hiss slither poison",
  "🐙": "octopus ocean sea tentacles purple",
  "🦈": "shark ocean sea predator teeth fish",
  "🐬": "dolphin ocean sea smart mammal swim",
  "🐳": "whale ocean sea big spout water",
  "🐠": "tropical fish ocean colorful swim",
  "🦞": "lobster sea red pincers dinner",
  "🦀": "crab sea beach sand pincers",
  "🍏": "green apple fruit fresh",
  "🍎": "red apple fruit sweet",
  "🍊": "orange fruit citrus peel juice",
  "🍋": "lemon fruit yellow sour citrus",
  "🍌": "banana fruit yellow sweet peel",
  "🍉": "watermelon fruit green pink seed summer",
  "🍇": "grapes fruit purple green bunch wine",
  "🍓": "strawberry fruit red sweet seed summer",
  "🫐": "blueberries fruit blue sweet healthy",
  "🍒": "cherries fruit red twin sweet stem",
  "🍑": "peach fruit soft orange skin sweet",
  "🥭": "mango fruit soft orange skin sweet",
  "🍍": "pineapple fruit tropical yellow crown",
  "🥑": "avocado green seed guac toast",
  "🥦": "broccoli green vegetable tree healthy",
  "🌽": "corn farm vegetable yellow cob crop",
  "🥕": "carrot vegetable orange farm root rabbit",
  "🥔": "potato root vegetable brown bake fries",
  "croissant": "croissant pastry bread bakery butter French",
  "bread": "bread loaf slice toast bakery wheat",
  "cheese": "cheese yellow dairy slice mouse swiss",
  "egg": "egg cooking pan breakfast fry",
  "🍳": "egg cooking pan breakfast fry",
  "pancake": "pancakes breakfast sweet syrup stack butter",
  "waffle": "waffle breakfast syrup sweet pattern grid",
  "bacon": "bacon breakfast pork cured meat",
  "steak": "steak meat beef dinner grilling",
  "chicken": "poultry chicken leg drumstick meat fry",
  "burger": "burger hamburger cheese meat bun fastfood",
  "french_fries": "french fries potato yellow fastfood chips",
  "pizza": "pizza slice cheese pepperoni Italian dinner",
  "sandwich": "sandwich bread lunch meat lettuce deli",
  "taco": "taco shell meat cheese Mexican wrap",
  "burrito": "burrito wrap meat bean rice Mexican",
  "salad": "salad bowl green lettuce healthy vegetable",
  "cake": "cake birthday candle slice sweet celebration",
  "cupcake": "cupcake sweet bakery dessert cherry frosting",
  "pie": "pie apple cherry dessert bakery crust baking",
  "🍫": "chocolate bar sweet candy brown cocoa",
  "🍬": "candy sweet wrapped sugar colorful",
  "🍭": "lollipop candy sweet swirl sugar kid",
  "☕": "coffee hot cup tea caffeine mug drink",
  "🍵": "tea green cup leaf hot drink",
  "🥤": "soda cup straw cold drink fastfood beverage",
  "beer": "beer mug glass alcohol drink bar pub foam",
  "beers": "beers mugs clinking toast cheers alcohol celebration",
  "champagne": "champagne bottle popping bubble sparkling celebration wine",
  "wine": "wine glass red alcohol drink grape dinner",
  "whiskey": "whiskey glass ice alcohol drink liquor rock",
  "cocktail": "cocktail glass tropical drink cherry garnish bar alcohol",
  "🚗": "car red auto drive vehicle road travel",
  "🚕": "taxi yellow cab passenger transport ride",
  "🚙": "suv blue auto vehicle drive road travel",
  "🚌": "bus transport transit passenger road trip",
  "🏎️": "racing car f1 track speed driver sport",
  "truck": "delivery truck transport shipping move cargo",
  "tractor": "tractor farm green agriculture crop plow",
  "motorcycle": "motorcycle bike drive speed rider motor",
  "bicycle": "bicycle bike cycle pedal ride sport health",
  "skateboard": "skateboard board deck wheels skate roll",
  "train": "train rail transit locomotive travel engine station",
  "airplane": "airplane plane flight fly sky airport travel jet",
  "rocket": "rocket space launch mission shuttle science ufo",
  "moon": "moon crescent night sky space sleep orbit",
  "sun": "sun hot day bright weather summer yellow",
  "cloud": "cloud overcast grey rain weather sky outline",
  "rain": "rain cloud storm weather wet drop water sky",
  "snow": "snow flake ice cold winter weather ski white",
  "mountain": "mountain hill climb peak snow rock nature high",
  "beach": "beach parasol sand island ocean sea resort summer",
  "tent": "tent camping outdoor camp forest sleep adventure",
  "house": "house home building residential living roof door",
  "⚽": "soccer football ball sport goal play pitch",
  "🏀": "basketball ball hoop sport play court game",
  "🏈": "football ball sport play game field helmet",
  "baseball": "baseball bat ball sport play game stadium glove",
  "tennis": "tennis racket ball court sport play match",
  "🎱": "billiards pool ball black eight game play table",
  "video_game": "video game controller console game player play stick",
  "art": "palette paint brush color draw artist gallery",
  "clapper": "clapperboard movie director scene film tape studio",
  "microphone": "microphone mic singing stage audio sound speak voice",
  "headphones": "headphones music audio sound listen dj stereo",
  "musical_keyboard": "piano keyboard synthesizer notes music instrument keys",
  "guitar": "guitar music instrument string acoustic rock play",
  "dice": "dice die game play roll luck board random",
  "laptop": "laptop computer screen work tech office key web",
  "phone": "smartphone mobile telephone screen cell call touch",
  "watch": "watch wrist clock time alarm alert tick",
  "camera": "camera photo shoot lens flash shutter memory picture",
  "book": "book reading paper story library study page open",
  "books": "books read library study school learn stack education",
  "envelope": "envelope mail letter post stamp send receive paper",
  "package": "box package parcel shipping carton delivery post brown",
  "pencil": "pencil write draw lead yellow sharp office school",
  "paperclip": "paperclip clip metal document attach hold office school",
  "key": "key lock open door security access metallic gold",
  "hammer": "hammer tool build construct nail handwork fix",
  "shield": "shield protection defense security guard war armor",
  "pill": "pill capsule medicine drug doctor health pharmacy sick",
  "moneybag": "money bag bag cash dollar gold coins wealth rich",
  "credit_card": "credit card visa payment cash transaction bank pay swipe",
  "gem": "gem diamond jewel stone shining ring luxury blue",
  "❤️": "heart love red emotion like favorite adore",
  "💔": "broken heart sad break pain split end",
  "❣️": "heart exclamation sign red punctuation",
  "💕": "two hearts love pink cute sweet",
  "💞": "revolving hearts love pink motion circle",
  "💓": "beating heart love pink pulse health signal",
  "💗": "growing heart love pink gradient size",
  "💖": "sparkling heart love pink shining glitter star",
  "💘": "arrow heart love valentine shoot cupid",
  "💝": "gift heart ribbon bow present love valentine",
  "💟": "heart decoration purple frame love symbol",
  "warning": "warning exclamation triangle yellow hazard sign alert caution",
  "prohibited": "prohibited ban entry stop slash red circle cancel",
  "hundred_points": "100 hundred points score grade perfect test red",
  "flag_us": "us america flag united states nation country",
  "flag_gb": "gb uk united kingdom flag country nation britain",
  "flag_in": "in india flag country nation saffron white green wheel",
  "flag_ca": "ca canada flag country nation maple leaf red white",
  "flag_au": "au australia flag country nation stars blue cross",
  "flag_jp": "jp japan flag country nation red circle white sun",
  "flag_de": "de germany flag country nation black red gold stripes",
  "flag_fr": "fr france flag country nation blue white red stripes"
};

const parseMessagePayload = (msg) => {
  if (!msg) return msg;
  try {
    if (msg.content && msg.content.startsWith('{"_isAttachment":true')) {
      const payload = JSON.parse(msg.content);
      return {
        ...msg,
        messageType: payload.messageType,
        fileUrl: payload.fileUrl,
        content: payload.fileName
      };
    }
  } catch (e) {
    console.warn("Failed to parse message content JSON:", e);
  }
  return msg;
};

const parseConversationItem = (convo) => {
  if (!convo || !convo.lastMessage) return convo;
  try {
    if (convo.lastMessage.content && convo.lastMessage.content.startsWith('{"_isAttachment":true')) {
      const payload = JSON.parse(convo.lastMessage.content);
      return {
        ...convo,
        lastMessage: {
          ...convo.lastMessage,
          content: payload.messageType === "image" ? "📸 Image" : "📁 Attachment"
        }
      };
    }
  } catch (e) {
    console.warn("Failed to parse convo lastMessage JSON:", e);
  }
  return convo;
};

export default function MessagesComponent() {
  const { user: rawCurrentUser } = useSelector((state) => state.auth);
  const currentUser = React.useMemo(() => {
    if (!rawCurrentUser) return null;
    return {
      ...rawCurrentUser,
      id: Number(rawCurrentUser.id)
    };
  }, [rawCurrentUser]);
  const { showToast, removeToast, updateToast } = useToast();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const convoIdParam = searchParams.get("convoId");

  // State definitions
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [isViewingArchived, setIsViewingArchived] = useState(false);
  const [dropdownConvo, setDropdownConvo] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [unlockedConvos, setUnlockedConvos] = useState({}); // { [convoId]: pin }
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockModalConfig, setLockModalConfig] = useState({ mode: "lock", convoId: null });
  const [unlockPin, setUnlockPin] = useState(["", "", "", ""]);
  const [unlockError, setUnlockError] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [lockModalPin, setLockModalPin] = useState(["", "", "", ""]);
  const [lockModalConfirmPin, setLockModalConfirmPin] = useState(["", "", "", ""]);
  const [lockModalError, setLockModalError] = useState("");
  const [lockModalLoading, setLockModalLoading] = useState(false);

  // States for resetting PIN
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetNewPin, setResetNewPin] = useState(["", "", "", ""]);
  const [resetConfirmPin, setResetConfirmPin] = useState(["", "", "", ""]);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);
  const [activeAllReactionsPickerId, setActiveAllReactionsPickerId] = useState(null);
  const [reactionSearch, setReactionSearch] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Loading states
  const [convoLoading, setConvoLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  // Selection & Dropdown Menu states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  // Custom Deletion Popup Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    type: "single", // "single" | "selected" | "clear" | "clear_list"
    messageId: null,
    messageIds: [],
    isOwnMessage: false,
    targetConvoId: null
  });

  // Group Chat specific states
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "groups"
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [showGroupInfoDrawer, setShowGroupInfoDrawer] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // Custom Confirmation Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: "Confirm Action",
    message: "Are you sure you want to perform this action?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: () => {}
  });

  const triggerConfirmModal = (title, message, confirmText, onConfirm, isDanger = false) => {
    setConfirmModalConfig({
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      isDanger,
      onConfirm: () => {
        onConfirm();
        setConfirmModalOpen(false);
      }
    });
    setConfirmModalOpen(true);
  };
  const [newMembersToAdd, setNewMembersToAdd] = useState([]);
  const [addMembersSearchQuery, setAddMembersSearchQuery] = useState("");

  // References for state tracking to avoid stale closures in polling interval
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const messagesRef = useRef(messages);
  const prevMessagesCountRef = useRef(messages.length);
  const activeConvoRef = useRef(activeConvo);
  const unlockedConvosRef = useRef(unlockedConvos);
  const pendingDeleteRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const lastLocalActionTimeRef = useRef(0);

  const handleContainerScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      isNearBottomRef.current = distanceToBottom < 150;
      setShowScrollToBottom(distanceToBottom > 300);
    }
  };

  // Sync state refs on changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeConvoRef.current = activeConvo;
  }, [activeConvo]);

  useEffect(() => {
    unlockedConvosRef.current = unlockedConvos;
  }, [unlockedConvos]);

  // Handle clicking outside of emoji picker and reaction pickers to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Main chat message input emoji picker
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiTriggerRef.current &&
        !emojiTriggerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
        setEmojiSearch("");
      }

      // Quick reaction picker popup
      if (
        activeReactionPickerId &&
        !event.target.closest(".reaction-picker-overlay") &&
        !event.target.closest(".reaction-trigger-button")
      ) {
        setActiveReactionPickerId(null);
      }

      // React with all emojis sub-picker popup
      if (
        activeAllReactionsPickerId &&
        !event.target.closest(".all-reactions-picker-overlay")
      ) {
        setActiveAllReactionsPickerId(null);
        setReactionSearch("");
      }

      // Archive/Pin options dropdown popup
      if (
        dropdownConvo &&
        !event.target.closest(".archive-options-trigger") &&
        !event.target.closest(".archive-options-dropdown-container")
      ) {
        setDropdownConvo(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, activeReactionPickerId, activeAllReactionsPickerId, dropdownConvo]);

  // Auto-select conversation if convoId parameter is provided in URL
  useEffect(() => {
    if (convoIdParam && conversations.length > 0) {
      const convoId = Number(convoIdParam);
      const matchedConvo = conversations.find(c => c.id === convoId);
      if (matchedConvo) {
        if (!activeConvo || activeConvo.id !== matchedConvo.id) {
          handleSelectConversation(matchedConvo);
        }
        searchParams.delete("convoId");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [convoIdParam, conversations, activeConvo]);

  // Load conversation list, available users, setup polling, and initialize auto-reconnecting WebSocket
  useEffect(() => {
    fetchConversations();
    fetchUsers();

    // Setup periodic polling for background message refreshes (every 5 seconds)
    pollingIntervalRef.current = setInterval(() => {
      pollConversationsAndActiveChat();
    }, 5000);

    let socket = null;
    let reconnectTimeout = null;
    let isMounted = true;

    // Determine WebSocket URL with multi-port dev support
    let wsUrl = '';
    const apiBase = import.meta.env.VITE_API_URL || '';
    if (apiBase) {
      try {
        const parsedUrl = new URL(apiBase);
        const wsProto = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProto}//${parsedUrl.host}`;
      } catch (_) {
        wsUrl = `ws://${window.location.hostname}:5000`;
      }
    } else {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const hostname = window.location.hostname;
      
      const isLocalDev = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        ['5173', '5174', '4173', '3000'].includes(window.location.port);
        
      if (isLocalDev) {
        wsUrl = `ws://${hostname}:5000`;
      } else {
        wsUrl = `${wsProto}//${wsHost}`;
      }
    }

    const connect = () => {
      if (!isMounted) return;

      const token = localStorage.getItem("token");
      let authenticatedWsUrl = wsUrl;
      if (token) {
        authenticatedWsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
      }

      console.log(`[WS Client] Connecting to WebSocket at ${authenticatedWsUrl}...`);
      socket = new WebSocket(authenticatedWsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) {
          socket.close();
          return;
        }
        console.log(`[WS Client] Connected to server`);
        socket.send(JSON.stringify({ type: "identify", userId: currentUser.id }));
      };

      socket.onmessage = (event) => {
        try {
          const packet = parseMessagePayload(JSON.parse(event.data));

          // Handle incoming new messages
          if (packet.type === "message") {
            if (packet.conversationId === activeConvoRef.current?.id) {
              setMessages(prev => {
                if (prev.some(m => m.id === packet.id)) return prev;
                return [...prev, packet];
              });
              scrollToBottom();
            }
            fetchConversations(false);
          }

          // Handle incoming reactions
          if (packet.type === "reaction") {
            setMessages(prev => prev.map(msg => {
              if (msg.id === packet.messageId) {
                const reactions = msg.reactions || [];
                const existingIdx = reactions.findIndex(r => r.senderId === packet.senderId);
                let updatedReactions = [...reactions];
                
                if (packet.isRemoved) {
                  if (existingIdx > -1) {
                    updatedReactions.splice(existingIdx, 1);
                  }
                } else {
                  if (existingIdx > -1) {
                    updatedReactions[existingIdx] = packet;
                  } else {
                    updatedReactions.push(packet);
                  }
                }
                return { ...msg, reactions: updatedReactions };
              }
              return msg;
            }));
          }

          // Handle incoming deletions
          if (packet.type === "delete") {
            if (packet.conversationId === activeConvoRef.current?.id) {
              setMessages(prev => prev.map(msg => 
                msg.id === packet.messageId 
                  ? { ...msg, content: packet.content || "[deleted_for_everyone]", reactions: [] } 
                  : msg
              ));
            }
            fetchConversations(false);
          }

          // Handle incoming clear chats
          if (packet.type === "clear") {
            if (packet.conversationId === activeConvoRef.current?.id) {
              if (packet.deleteType === "everyone") {
                setMessages([]);
              }
            }
            fetchConversations(false);
          }

          // Handle incoming pin message events
          if (packet.type === "pin") {
            if (packet.conversationId === activeConvoRef.current?.id) {
              setActiveConvo(prev => prev ? { 
                ...prev, 
                pinnedMessageId: packet.messageId,
                pinnedMessage: packet.pinnedMessage
              } : null);
            }
            fetchConversations(false);
          }

          // Handle incoming unpin message events
          if (packet.type === "unpin") {
            if (packet.conversationId === activeConvoRef.current?.id) {
              setActiveConvo(prev => prev ? { 
                ...prev, 
                pinnedMessageId: null,
                pinnedMessage: null
              } : null);
            }
            fetchConversations(false);
          }

          // Handle incoming pin chat events (for multi-tab sync)
          if (packet.type === "pin-chat") {
            // Skip if this is our own action — already applied optimistically
            if (packet.userId === currentUser.id) return;
            const updatePinState = (c) => {
              if (c.id === packet.conversationId) {
                const ids = c.pinnedByIds || [];
                if (ids.includes(packet.userId)) return c;
                return { ...c, pinnedByIds: [...ids, packet.userId] };
              }
              return c;
            };
            setConversations(prev => prev.map(updatePinState));
            setArchivedConversations(prev => prev.map(updatePinState));
            setActiveConvo(prev => {
              if (prev && prev.id === packet.conversationId) {
                const ids = prev.pinnedByIds || [];
                if (ids.includes(packet.userId)) return prev;
                return { ...prev, pinnedByIds: [...ids, packet.userId] };
              }
              return prev;
            });
          }

          // Handle incoming unpin chat events (for multi-tab sync)
          if (packet.type === "unpin-chat") {
            // Skip if this is our own action — already applied optimistically
            if (packet.userId === currentUser.id) return;
            const updateUnpinState = (c) => {
              if (c.id === packet.conversationId) {
                return {
                  ...c,
                  pinnedByIds: (c.pinnedByIds || []).filter(id => id !== packet.userId)
                };
              }
              return c;
            };
            setConversations(prev => prev.map(updateUnpinState));
            setArchivedConversations(prev => prev.map(updateUnpinState));
            setActiveConvo(prev => {
              if (prev && prev.id === packet.conversationId) {
                return {
                  ...prev,
                  pinnedByIds: (prev.pinnedByIds || []).filter(id => id !== packet.userId)
                };
              }
              return prev;
            });
          }

          // Handle incoming archive chat events (for multi-tab sync)
          // Skip — own actions are already applied optimistically by the handler
          if (packet.type === "archive-chat") {
            if (packet.userId === currentUser.id) return;
          }

          // Handle incoming unarchive chat events (for multi-tab sync)
          // Skip — own actions are already applied optimistically by the handler
          if (packet.type === "unarchive-chat") {
            if (packet.userId === currentUser.id) return;
          }
        } catch (err) {
          console.warn("[WS Client] Packet parse failed:", err);
        }
      };

      socket.onerror = (err) => {
        console.warn("[WS Client] WebSocket connection error:", err);
      };

      socket.onclose = () => {
        console.log("[WS Client] WebSocket connection closed");
        if (isMounted) {
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [currentUser.id]);

  // Cleanup pending delete timeout on component unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        if (pendingDeleteRef.current.intervalId) clearInterval(pendingDeleteRef.current.intervalId);
        if (pendingDeleteRef.current.toastId) removeToast(pendingDeleteRef.current.toastId);
        pendingDeleteRef.current.actionFn();
      }
    };
  }, [removeToast]);

  // Immediately execute any active pending delete action
  const flushPendingDelete = () => {
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      if (pendingDeleteRef.current.intervalId) clearInterval(pendingDeleteRef.current.intervalId);
      if (pendingDeleteRef.current.toastId) removeToast(pendingDeleteRef.current.toastId);
      
      pendingDeleteRef.current.actionFn();
      pendingDeleteRef.current = null;
      setPendingDeleteIds([]);
    }
  };

  // Undo the pending delete action, restoring local messages state
  const undoPendingDelete = () => {
    if (!pendingDeleteRef.current) return;

    const { type, deletedMessages, deleteType, timeoutId, intervalId, toastId } = pendingDeleteRef.current;
    clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    if (toastId) removeToast(toastId);

    setPendingDeleteIds([]);

    if (type === "clear") {
      // Re-merge deleted messages with any new messages sent in the meantime
      setMessages(prev => {
        const merged = [...deletedMessages, ...prev];
        const seen = new Set();
        return merged
          .filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          })
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    } else if (type === "single" || type === "selected") {
      if (deleteType === "everyone") {
        // Revert deleted message content back from "[deleted_for_everyone]"
        setMessages(prev => prev.map(msg => {
          const original = deletedMessages.find(dm => dm.id === msg.id);
          return original ? { ...msg, content: original.content, reactions: original.reactions } : msg;
        }));
      } else {
        // Restore deleted messages back into the list
        setMessages(prev => {
          const merged = [...prev, ...deletedMessages];
          const seen = new Set();
          return merged
            .filter(m => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    }

    pendingDeleteRef.current = null;
    showToast("Deletion undone.", "success");
  };

  // Scroll message thread area to bottom
  const scrollToBottom = (force = false) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        if (force || isNearBottomRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
          setShowScrollToBottom(false);
        }
      } else {
        if (force || isNearBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          setShowScrollToBottom(false);
        }
      }
    }, 100);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    // Only scroll if a new message was actually added
    if (messages.length > prevCount) {
      const lastMsg = messages[messages.length - 1];
      const isOwnLastMsg = lastMsg && lastMsg.senderId === currentUser.id;
      if (isOwnLastMsg) {
        scrollToBottom(true);
      } else if (isNearBottomRef.current) {
        scrollToBottom(false);
      }
    }
  }, [messages]);

  // Fetch all conversation threads from API
  const fetchConversations = async (showSkeleton = true) => {
    if (!showSkeleton && Date.now() - lastLocalActionTimeRef.current < 8000) {
      return; // Skip background sync while database writes for local actions are pending
    }
    if (showSkeleton) setConvoLoading(true);
    try {
      const [res, archivedRes] = await Promise.all([
        messageService.getConversations(false),
        messageService.getConversations(true)
      ]);
      if (res.success) {
        setConversations((res.data || []).map(parseConversationItem));
      }
      if (archivedRes.success) {
        setArchivedConversations((archivedRes.data || []).map(parseConversationItem));
      }
    } catch (err) {
      console.error("Failed to load conversations list:", err);
    } finally {
      if (showSkeleton) setConvoLoading(false);
    }
  };

  // Fetch all active system users available for starting new chats
  const fetchUsers = async () => {
    try {
      const res = await messageService.getAvailableUsers();
      if (res.success) {
        setAvailableUsers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load available chat users:", err);
    }
  };

  // Background polling handler to refresh updates
  const pollConversationsAndActiveChat = async () => {
    if (pendingDeleteRef.current) return;
    if (Date.now() - lastLocalActionTimeRef.current < 8000) return;
    try {
      const [convoRes, archivedRes] = await Promise.all([
        messageService.getConversations(false),
        messageService.getConversations(true)
      ]);
      if (convoRes.success) {
        setConversations((convoRes.data || []).map(parseConversationItem));
      }
      if (archivedRes.success) {
        setArchivedConversations((archivedRes.data || []).map(parseConversationItem));
      }

      const currentActiveConvo = activeConvoRef.current;
      if (currentActiveConvo) {
        if (currentActiveConvo.isLocked && !unlockedConvosRef.current[currentActiveConvo.id]) {
          return;
        }
        const pin = unlockedConvosRef.current[currentActiveConvo.id] || null;
        const msgRes = await messageService.getConversationMessages(currentActiveConvo.id, pin);
        if (msgRes.success) {
          const hasChanges = msgRes.data.length !== messagesRef.current.length ||
            msgRes.data.some((msg, index) => {
              const currentMsg = messagesRef.current[index];
              return !currentMsg || currentMsg.id !== msg.id || currentMsg.isRead !== msg.isRead || currentMsg.content !== msg.content;
            });

          if (hasChanges) {
            setMessages((msgRes.data || []).map(parseMessagePayload));
          }
        }
      }
    } catch (err) {
      console.warn("Background polling refresh failed:", err.message);
    }
  };

  // Archive / Unarchive handlers
  const handleArchiveConversation = async (convoId) => {
    lastLocalActionTimeRef.current = Date.now();
    // 1. Find conversation BEFORE setState to avoid React batching issues
    const convoToMove = conversations.find(c => c.id === convoId);

    // 2. Optimistic Update
    setConversations(prev => prev.filter(c => c.id !== convoId));

    if (convoToMove) {
      const archivedIds = convoToMove.archivedByIds || [];
      const updatedConvo = {
        ...convoToMove,
        archivedByIds: archivedIds.includes(currentUser.id) ? archivedIds : [...archivedIds, currentUser.id]
      };
      setArchivedConversations(prev => {
        if (prev.some(c => c.id === convoId)) return prev;
        return [updatedConvo, ...prev];
      });
    }

    if (activeConvoRef.current && activeConvoRef.current.id === convoId) {
      setActiveConvo(null);
      setMessages([]);
    }

    // 3. Real-time Multi-tab sync
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "archive-chat",
        conversationId: convoId,
        userId: currentUser.id
      }));
    }

    try {
      const res = await messageService.archiveConversation(convoId);
      if (res.success) {
        showToast("Conversation archived successfully.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to archive conversation.", "error");
      lastLocalActionTimeRef.current = 0; // Allow immediate re-fetch on error
      await fetchConversations(false);
    }
  };

  const handleUnarchiveConversation = async (convoId) => {
    lastLocalActionTimeRef.current = Date.now();
    // 1. Find conversation BEFORE setState to avoid React batching issues
    const convoToMove = archivedConversations.find(c => c.id === convoId);

    // 2. Optimistic Update
    setArchivedConversations(prev => prev.filter(c => c.id !== convoId));

    if (convoToMove) {
      const updatedConvo = {
        ...convoToMove,
        archivedByIds: (convoToMove.archivedByIds || []).filter(id => id !== currentUser.id)
      };
      setConversations(prev => {
        if (prev.some(c => c.id === convoId)) return prev;
        return [updatedConvo, ...prev];
      });
    }

    // 3. Real-time Multi-tab sync
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "unarchive-chat",
        conversationId: convoId,
        userId: currentUser.id
      }));
    }

    try {
      const res = await messageService.unarchiveConversation(convoId);
      if (res.success) {
        showToast("Conversation unarchived successfully.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unarchive conversation.", "error");
      lastLocalActionTimeRef.current = 0; // Allow immediate re-fetch on error
      await fetchConversations(false);
    }
  };

  const handlePinConversation = async (convoId) => {
    lastLocalActionTimeRef.current = Date.now();
    // 1. Optimistic Update (with dedup guard)
    const updatePinState = (c) => {
      if (c.id === convoId) {
        const ids = c.pinnedByIds || [];
        if (ids.includes(currentUser.id)) return c;
        return { ...c, pinnedByIds: [...ids, currentUser.id] };
      }
      return c;
    };
    setConversations(prev => prev.map(updatePinState));
    setArchivedConversations(prev => prev.map(updatePinState));
    setActiveConvo(prev => {
      if (prev && prev.id === convoId) {
        const ids = prev.pinnedByIds || [];
        if (ids.includes(currentUser.id)) return prev;
        return { ...prev, pinnedByIds: [...ids, currentUser.id] };
      }
      return prev;
    });

    // 2. Real-time Multi-tab sync
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "pin-chat",
        conversationId: convoId,
        userId: currentUser.id
      }));
    }

    try {
      const res = await messageService.pinConversation(convoId);
      if (res.success) {
        showToast("Conversation pinned successfully.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to pin conversation.", "error");
      lastLocalActionTimeRef.current = 0;
      await fetchConversations(false);
    }
  };

  const handleUnpinConversation = async (convoId) => {
    lastLocalActionTimeRef.current = Date.now();
    // 1. Optimistic Update
    const updateUnpinState = (c) => {
      if (c.id === convoId) {
        return {
          ...c,
          pinnedByIds: (c.pinnedByIds || []).filter(id => id !== currentUser.id)
        };
      }
      return c;
    };
    setConversations(prev => prev.map(updateUnpinState));
    setArchivedConversations(prev => prev.map(updateUnpinState));
    setActiveConvo(prev => {
      if (prev && prev.id === convoId) {
        return {
          ...prev,
          pinnedByIds: (prev.pinnedByIds || []).filter(id => id !== currentUser.id)
        };
      }
      return prev;
    });

    // 2. Real-time Multi-tab sync
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "unpin-chat",
        conversationId: convoId,
        userId: currentUser.id
      }));
    }

    try {
      const res = await messageService.unpinConversation(convoId);
      if (res.success) {
        showToast("Conversation unpinned successfully.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unpin conversation.", "error");
      lastLocalActionTimeRef.current = 0;
      await fetchConversations(false);
    }
  };

  const handleOpenDropdown = (e, convo) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.right - 128
    });
    setDropdownConvo(convo);
  };

  // Pin / Unpin handlers
  const handlePinMessage = async (messageId) => {
    if (!activeConvoRef.current) return;
    try {
      const res = await messageService.pinMessage(activeConvoRef.current.id, messageId);
      if (res.success) {
        showToast("Message pinned successfully.", "success");
        const pinnedMsgObj = messagesRef.current.find(m => m.id === messageId);
        
        setActiveConvo(prev => prev ? { 
          ...prev, 
          pinnedMessageId: messageId,
          pinnedMessage: pinnedMsgObj ? {
            id: pinnedMsgObj.id,
            content: pinnedMsgObj.content,
            sender: pinnedMsgObj.sender
          } : null
        } : null);

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "pin",
            conversationId: activeConvoRef.current.id,
            messageId,
            pinnedMessage: pinnedMsgObj ? {
              id: pinnedMsgObj.id,
              content: pinnedMsgObj.content,
              sender: pinnedMsgObj.sender
            } : null
          }));
        }
        await fetchConversations(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to pin message.", "error");
    }
  };

  const handleUnpinMessage = async () => {
    if (!activeConvoRef.current) return;
    try {
      const res = await messageService.unpinMessage(activeConvoRef.current.id);
      if (res.success) {
        showToast("Message unpinned successfully.", "success");
        
        setActiveConvo(prev => prev ? { 
          ...prev, 
          pinnedMessageId: null,
          pinnedMessage: null
        } : null);

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "unpin",
            conversationId: activeConvoRef.current.id
          }));
        }
        await fetchConversations(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unpin message.", "error");
    }
  };

  const handleScrollToPinned = () => {
    if (!activeConvo?.pinnedMessageId) return;
    const element = document.getElementById(`msg-${activeConvo.pinnedMessageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-indigo-50/70", "ring-2", "ring-indigo-500/20");
      setTimeout(() => {
        element.classList.remove("bg-indigo-50/70", "ring-2", "ring-indigo-500/20");
      }, 2000);
    } else {
      showToast("Pinned message is too far back. Scroll up to find it.", "info");
    }
  };

  // Group creation handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast("Group name is required.", "error");
      return;
    }
    if (selectedGroupMembers.length === 0) {
      showToast("Please select at least one other participant.", "error");
      return;
    }

    try {
      const res = await messageService.createGroup(
        newGroupName.trim(),
        selectedGroupMembers
      );
      if (res.success) {
        showToast("Group created successfully!", "success");
        setShowCreateGroupModal(false);
        setNewGroupName("");
        setSelectedGroupMembers([]);
        await fetchConversations(true);
        // Automatically select the new group
        const createdGroup = res.data;
        if (createdGroup) {
          handleSelectConversation(createdGroup);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create group.", "error");
    }
  };

  // Group leave handler
  const handleLeaveGroup = async () => {
    if (!activeConvo) return;
    triggerConfirmModal(
      "Leave Group",
      "Are you sure you want to leave this group chat?",
      "Leave",
      async () => {
        try {
          const res = await messageService.leaveGroup(activeConvo.id);
          if (res.success) {
            if (res.systemMessage && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "message",
                ...res.systemMessage
              }));
            }
            showToast("You left the group chat.", "success");
            setShowGroupInfoDrawer(false);
            setActiveConvo(null);
            await fetchConversations(true);
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to leave group.", "error");
        }
      },
      true
    );
  };

  // Group add members handler
  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (!activeConvo || newMembersToAdd.length === 0) return;

    try {
      const res = await messageService.addGroupMembers(activeConvo.id, newMembersToAdd);
      if (res.success) {
        showToast("Members added to group successfully!", "success");
        setShowAddMembersModal(false);
        setNewMembersToAdd([]);
        // Update activeConvo with the new participants list
        const updatedGroup = res.data;
        setActiveConvo(updatedGroup);
        // Refresh conversations list to sync members count
        setConversations(prev =>
          prev.map(c => c.id === updatedGroup.id ? updatedGroup : c)
        );

        if (res.systemMessage) {
          setMessages(prev => [...prev, res.systemMessage]);
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "message",
              ...res.systemMessage
            }));
          }
          scrollToBottom();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add members.", "error");
    }
  };

  // Group remove member handler
  const handleRemoveMember = async (targetUserId) => {
    if (!activeConvo) return;
    triggerConfirmModal(
      "Remove Member",
      "Are you sure you want to remove this member from the group?",
      "Remove",
      async () => {
        try {
          const res = await messageService.removeGroupMember(activeConvo.id, targetUserId);
          if (res.success) {
            showToast("Member removed from group.", "success");
            // Update activeConvo with the new participants list
            const updatedGroup = res.data;
            setActiveConvo(updatedGroup);
            // Refresh conversations list
            setConversations(prev =>
              prev.map(c => c.id === updatedGroup.id ? updatedGroup : c)
            );

            if (res.systemMessage) {
              setMessages(prev => [...prev, res.systemMessage]);
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "message",
                  ...res.systemMessage
                }));
              }
              scrollToBottom();
            }
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to remove member.", "error");
        }
      },
      true
    );
  };

  // Group promote member to admin handler
  const handleMakeGroupAdmin = async (targetUserId) => {
    if (!activeConvo) return;
    triggerConfirmModal(
      "Promote Member",
      "Are you sure you want to promote this member to a group administrator?",
      "Promote",
      async () => {
        try {
          const res = await messageService.makeGroupAdmin(activeConvo.id, targetUserId);
          if (res.success) {
            showToast("Member promoted to administrator successfully!", "success");
            // Update activeConvo with the new adminIds list
            const updatedGroup = res.data;
            setActiveConvo(updatedGroup);
            // Refresh conversations list
            setConversations(prev =>
              prev.map(c => c.id === updatedGroup.id ? updatedGroup : c)
            );

            if (res.systemMessage) {
              setMessages(prev => [...prev, res.systemMessage]);
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "message",
                  ...res.systemMessage
                }));
              }
              scrollToBottom();
            }
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to promote member.", "error");
        }
      }
    );
  };

  // Group demote member handler
  const handleDemoteGroupAdmin = async (targetUserId) => {
    if (!activeConvo) return;
    triggerConfirmModal(
      "Demote Admin",
      "Are you sure you want to demote this administrator to a normal member?",
      "Demote",
      async () => {
        try {
           const res = await messageService.demoteGroupAdmin(activeConvo.id, targetUserId);
          if (res.success) {
            showToast("Administrator demoted successfully.", "success");
            // Update activeConvo with the new adminIds list
            const updatedGroup = res.data;
            setActiveConvo(updatedGroup);
            // Refresh conversations list
            setConversations(prev =>
              prev.map(c => c.id === updatedGroup.id ? updatedGroup : c)
            );

            if (res.systemMessage) {
              setMessages(prev => [...prev, res.systemMessage]);
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: "message",
                  ...res.systemMessage
                }));
              }
              scrollToBottom();
            }
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to demote administrator.", "error");
        }
      },
      true
    );
  };

  // Group delete handler
  const handleDeleteGroup = async () => {
    if (!activeConvo) return;
    triggerConfirmModal(
      "Delete Group Chat",
      "WARNING: Are you sure you want to delete this group chat? This will permanently delete the chat room and all messages for all participants.",
      "Delete",
      async () => {
        try {
          const res = await messageService.deleteGroup(activeConvo.id);
          if (res.success) {
            showToast("Group chat deleted successfully.", "success");
            setShowGroupInfoDrawer(false);
            setActiveConvo(null);
            await fetchConversations(true);
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete group.", "error");
        }
      },
      true
    );
  };

  // Selects an existing conversation and fetches its messages
  const handleSelectConversation = async (convo, pin = null) => {
    flushPendingDelete();
    setActiveConvo(convo);
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
    setShowMenu(false);

    const actualPin = pin || unlockedConvos[convo.id] || null;

    if (convo.isLocked && !actualPin) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);
    prevMessagesCountRef.current = 0;
    try {
      const res = await messageService.getConversationMessages(convo.id, actualPin);
      if (res.success) {
        setMessages((res.data || []).map(parseMessagePayload));
        
        // Zero out unread count client-side immediately
        setConversations(prev => 
          prev.map(c => c.id === convo.id ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      showToast("Failed to load chat messages.", "error");
    } finally {
      setMessagesLoading(false);
      isNearBottomRef.current = true;
      scrollToBottom(true);
    }
  };

  const handleUnlockSubmit = async (e) => {
    if (e) e.preventDefault();
    const pinStr = unlockPin.join("");
    if (pinStr.length !== 4) return;
    setUnlockLoading(true);
    setUnlockError("");
    try {
      const res = await messageService.unlockConversation(activeConvo.id, pinStr);
      if (res.success) {
        setUnlockedConvos(prev => ({
          ...prev,
          [activeConvo.id]: pinStr
        }));
        setUnlockPin(["", "", "", ""]);
        await handleSelectConversation(activeConvo, pinStr);
      }
    } catch (err) {
      setUnlockError(err.response?.data?.message || "Invalid PIN. Please try again.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleUnlockPinChange = (val, idx) => {
    if (val && !/^\d$/.test(val)) return;
    const newPin = [...unlockPin];
    newPin[idx] = val;
    setUnlockPin(newPin);
    if (val && idx < 3) {
      document.getElementById(`pin-unlock-${idx + 1}`)?.focus();
    }
  };

  const handleUnlockPinKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !unlockPin[idx] && idx > 0) {
      document.getElementById(`pin-unlock-${idx - 1}`)?.focus();
    }
  };

  const handleResetPinSubmit = async (e) => {
    if (e) e.preventDefault();
    const pinStr = resetNewPin.join("");
    const confirmStr = resetConfirmPin.join("");
    
    if (!resetPassword) {
      setResetError("Account password is required.");
      return;
    }
    
    if (pinStr.length !== 4) {
      setResetError("PIN must be 4 digits.");
      return;
    }
    
    if (pinStr !== confirmStr) {
      setResetError("PINs do not match.");
      return;
    }
    
    setResetLoading(true);
    setResetError("");
    try {
      const res = await messageService.resetChatPin(resetPassword, pinStr);
      if (res.success) {
        showToast("PIN reset successfully.", "success");
        setUnlockedConvos(prev => ({
          ...prev,
          [activeConvo.id]: pinStr
        }));
        setIsResettingPin(false);
        setResetPassword("");
        setResetNewPin(["", "", "", ""]);
        setResetConfirmPin(["", "", "", ""]);
        setUnlockPin(["", "", "", ""]);
        await handleSelectConversation(activeConvo, pinStr);
      }
    } catch (err) {
      setResetError(err.response?.data?.message || "Failed to reset PIN.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPinChange = (val, idx, isConfirm) => {
    if (val && !/^\d$/.test(val)) return;
    const targetPin = isConfirm ? resetConfirmPin : resetNewPin;
    const setTargetPin = isConfirm ? setResetConfirmPin : setResetNewPin;
    const prefix = isConfirm ? "pin-reset-confirm-" : "pin-reset-";
    
    const newPin = [...targetPin];
    newPin[idx] = val;
    setTargetPin(newPin);
    if (val && idx < 3) {
      document.getElementById(`${prefix}${idx + 1}`)?.focus();
    }
  };

  const handleResetPinKeyDown = (e, idx, isConfirm) => {
    const targetPin = isConfirm ? resetConfirmPin : resetNewPin;
    const prefix = isConfirm ? "pin-reset-confirm-" : "pin-reset-";
    if (e.key === "Backspace" && !targetPin[idx] && idx > 0) {
      document.getElementById(`${prefix}${idx - 1}`)?.focus();
    }
  };

  const handleLockMenuClick = () => {
    if (activeConvo.isLocked) {
      setLockModalConfig({ mode: "remove", convoId: activeConvo.id });
    } else {
      setLockModalConfig({ mode: "lock", convoId: activeConvo.id });
    }
    setLockModalPin(["", "", "", ""]);
    setLockModalConfirmPin(["", "", "", ""]);
    setLockModalError("");
    setShowLockModal(true);
  };

  const handleLockModalSubmit = async (e) => {
    if (e) e.preventDefault();
    const pinStr = lockModalPin.join("");
    const confirmStr = lockModalConfirmPin.join("");
    
    if (pinStr.length !== 4) {
      setLockModalError("PIN must be 4 digits.");
      return;
    }
    
    const isAnyConvoLocked = conversations.some(c => c.isLocked);
    if (lockModalConfig.mode === "lock" && !isAnyConvoLocked && pinStr !== confirmStr) {
      setLockModalError("PINs do not match.");
      return;
    }
    
    setLockModalLoading(true);
    setLockModalError("");
    try {
      if (lockModalConfig.mode === "lock") {
        const res = await messageService.lockConversation(lockModalConfig.convoId, pinStr);
        if (res.success) {
          showToast("Chat locked successfully.", "success");
          setUnlockedConvos(prev => ({
            ...prev,
            [lockModalConfig.convoId]: pinStr
          }));
          setConversations(prev => 
            prev.map(c => c.id === lockModalConfig.convoId ? { ...c, isLocked: true } : c)
          );
          if (activeConvo && activeConvo.id === lockModalConfig.convoId) {
            setActiveConvo(prev => ({ ...prev, isLocked: true }));
          }
          setShowLockModal(false);
        }
      } else {
        const res = await messageService.removeConversationLock(lockModalConfig.convoId, pinStr);
        if (res.success) {
          showToast("Chat lock removed successfully.", "success");
          setUnlockedConvos(prev => {
            const next = { ...prev };
            delete next[lockModalConfig.convoId];
            return next;
          });
          setConversations(prev => 
            prev.map(c => c.id === lockModalConfig.convoId ? { ...c, isLocked: false } : c)
          );
          if (activeConvo && activeConvo.id === lockModalConfig.convoId) {
            setActiveConvo(prev => ({ ...prev, isLocked: false }));
          }
          setShowLockModal(false);
        }
      }
    } catch (err) {
      setLockModalError(err.response?.data?.message || "Failed to process lock request.");
    } finally {
      setLockModalLoading(false);
    }
  };

  const handleLockPinChange = (val, idx, isConfirm = false) => {
    if (val && !/^\d$/.test(val)) return;
    if (isConfirm) {
      const newConfirm = [...lockModalConfirmPin];
      newConfirm[idx] = val;
      setLockModalConfirmPin(newConfirm);
      if (val && idx < 3) {
        document.getElementById(`pin-lock-confirm-${idx + 1}`)?.focus();
      }
    } else {
      const newPin = [...lockModalPin];
      newPin[idx] = val;
      setLockModalPin(newPin);
      if (val && idx < 3) {
        document.getElementById(`pin-lock-${idx + 1}`)?.focus();
      }
    }
  };

  const handleLockPinKeyDown = (e, idx, isConfirm = false) => {
    if (e.key === "Backspace" && idx > 0) {
      if (isConfirm) {
        if (!lockModalConfirmPin[idx]) {
          document.getElementById(`pin-lock-confirm-${idx - 1}`)?.focus();
        }
      } else {
        if (!lockModalPin[idx]) {
          document.getElementById(`pin-lock-${idx - 1}`)?.focus();
        }
      }
    }
  };

  // Toggle selection of a message for bulk action
  const handleToggleSelectMessage = (messageId) => {
    setSelectedMessageIds(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId) 
        : [...prev, messageId]
    );
  };

  // Trigger single message delete popup
  const triggerDeleteSingleMessage = (messageId, isOwnMessage) => {
    const isGroupConvo = activeConvo?.type === "GROUP";
    const isUserGroupAdmin = isGroupConvo && (activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN");

    const targetMsg = messages.find(m => m.id === messageId);
    const isPlaceholder = targetMsg?.content === "[deleted_for_everyone]" || targetMsg?.content === "[deleted_by_admin]";

    setDeleteModalConfig({
      type: "single",
      messageId,
      messageIds: [],
      isOwnMessage: isPlaceholder ? false : (isOwnMessage || isUserGroupAdmin)
    });
    setDeleteModalOpen(true);
  };

  // Trigger selected messages delete popup
  const triggerDeleteSelectedMessages = () => {
    if (selectedMessageIds.length === 0) return;
    
    // Check if all selected messages belong to the current user
    const selectedMsgs = messages.filter(msg => selectedMessageIds.includes(msg.id));
    const allOwn = selectedMsgs.every(msg => msg.senderId === currentUser.id);

    const isGroupConvo = activeConvo?.type === "GROUP";
    const isUserGroupAdmin = isGroupConvo && (activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN");

    setDeleteModalConfig({
      type: "selected",
      messageId: null,
      messageIds: selectedMessageIds,
      isOwnMessage: allOwn || isUserGroupAdmin
    });
    setDeleteModalOpen(true);
  };

  // Trigger clear chat popup
  const triggerClearChat = () => {
    setDeleteModalConfig({
      type: "clear",
      messageId: null,
      messageIds: [],
      isOwnMessage: false,
      targetConvoId: null
    });
    setDeleteModalOpen(true);
  };

  // Trigger delete conversation popup from chat list
  const handleDeleteConversationClick = (e, convoId) => {
    e.stopPropagation();
    setDeleteModalConfig({
      type: "clear_list",
      messageId: null,
      messageIds: [],
      isOwnMessage: false,
      targetConvoId: convoId
    });
    setDeleteModalOpen(true);
  };

  // Handle actual confirm from custom delete modal
  const confirmDeleteAction = async (deleteType) => {
    setDeleteModalOpen(false);
    
    // Immediately execute any existing pending deletion first
    flushPendingDelete();

    const currentConvoId = activeConvo.id;

    if (deleteModalConfig.type === "single") {
      const messageId = deleteModalConfig.messageId;
      const targetMsg = messages.find(m => m.id === messageId);
      if (!targetMsg) return;

      // 1. Optimistic UI update
      if (deleteType === "everyone") {
        const isOwnMsg = targetMsg.senderId === currentUser.id;
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: isOwnMsg ? "[deleted_for_everyone]" : "[deleted_by_admin]", reactions: [] } : msg
        ));
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        // Hide immediately in UI only when deleting for me
        setPendingDeleteIds(prev => [...prev, messageId]);
      }

      // 2. Setup the actual backend task
      const actionFn = async () => {
        try {
          const res = await messageService.deleteSingleMessage(currentConvoId, messageId, deleteType);
          if (res.success) {
            if (deleteType === "everyone" && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              const isOwnMsg = targetMsg.senderId === currentUser.id;
              socketRef.current.send(JSON.stringify({
                type: "delete",
                conversationId: currentConvoId,
                messageId: messageId,
                deleteType: "everyone",
                content: isOwnMsg ? "[deleted_for_everyone]" : "[deleted_by_admin]"
              }));
            }
            fetchConversations(false);
          }
        } catch (err) {
          console.error("Delayed single message deletion failed:", err);
        }
      };

      // 3. Queue the task and show Toast with Undo
      let timeLeft = 5;
      let toastId = null;

      const getToastMessage = (time) => {
        const typeText = deleteType === "me" ? "for you" : "for everyone";
        return `Message will be deleted ${typeText} in ${time}s.`;
      };

      const actionWrapperFn = async () => {
        if (toastId) removeToast(toastId);
        await actionFn();
        setPendingDeleteIds(prev => prev.filter(id => id !== messageId));
        if (pendingDeleteRef.current && pendingDeleteRef.current.timeoutId === timeoutId) {
          pendingDeleteRef.current = null;
        }
      };

      const timeoutId = setTimeout(actionWrapperFn, 5000);

      toastId = showToast(
        getToastMessage(timeLeft),
        "success",
        5500,
        { label: "Undo", onClick: undoPendingDelete }
      );

      const intervalId = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft > 0) {
          updateToast(toastId, getToastMessage(timeLeft), "success", { label: "Undo", onClick: undoPendingDelete });
        } else {
          clearInterval(intervalId);
        }
      }, 1000);

      pendingDeleteRef.current = {
        type: "single",
        deleteType,
        deletedMessages: [targetMsg],
        timeoutId,
        intervalId,
        toastId,
        actionFn: actionWrapperFn
      };

    } else if (deleteModalConfig.type === "selected") {
      const ids = deleteModalConfig.messageIds;
      const targetMsgs = messages.filter(m => ids.includes(m.id));
      if (targetMsgs.length === 0) return;

      const isGroupConvo = activeConvo?.type === "GROUP";
      const isUserGroupAdmin = isGroupConvo && (activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN");

      // 1. Optimistic UI update
      if (deleteType === "everyone") {
        setMessages(prev => prev.map(msg => {
          if (ids.includes(msg.id) && (msg.senderId === currentUser.id || isUserGroupAdmin)) {
            const isOwnMsg = msg.senderId === currentUser.id;
            return { ...msg, content: isOwnMsg ? "[deleted_for_everyone]" : "[deleted_by_admin]", reactions: [] };
          }
          return msg;
        }).filter(msg => !(ids.includes(msg.id) && msg.senderId !== currentUser.id && !isUserGroupAdmin)));

        // Hide immediately in UI only those that are NOT kept as placeholders
        const hiddenIds = ids.filter(id => {
          const msgObj = targetMsgs.find(m => m.id === id);
          const canDeleteForEveryone = msgObj && (msgObj.senderId === currentUser.id || isUserGroupAdmin);
          return !canDeleteForEveryone;
        });
        if (hiddenIds.length > 0) {
          setPendingDeleteIds(prev => [...prev, ...hiddenIds]);
        }
      } else {
        setMessages(prev => prev.filter(msg => !ids.includes(msg.id)));
        setPendingDeleteIds(prev => [...prev, ...ids]);
      }

      // 2. Setup the actual backend task
      const actionFn = async () => {
        try {
          const res = await messageService.deleteMessages(currentConvoId, ids, deleteType);
          if (res.success) {
            if (deleteType === "everyone" && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              ids.forEach(messageId => {
                const msgObj = targetMsgs.find(m => m.id === messageId);
                const canDeleteForEveryone = msgObj && (msgObj.senderId === currentUser.id || isUserGroupAdmin);
                if (canDeleteForEveryone) {
                  const isOwnMsg = msgObj.senderId === currentUser.id;
                  socketRef.current.send(JSON.stringify({
                    type: "delete",
                    conversationId: currentConvoId,
                    messageId: messageId,
                    deleteType: "everyone",
                    content: isOwnMsg ? "[deleted_for_everyone]" : "[deleted_by_admin]"
                  }));
                }
              });
            }
            fetchConversations(false);
          }
        } catch (err) {
          console.error("Delayed bulk message deletion failed:", err);
        }
      };

      // 3. Queue the task and show Toast with Undo
      let timeLeft = 5;
      let toastId = null;

      const getToastMessage = (time) => {
        return `Selected messages will be deleted in ${time}s.`;
      };

      const actionWrapperFn = async () => {
        if (toastId) removeToast(toastId);
        await actionFn();
        setPendingDeleteIds(prev => prev.filter(id => !ids.includes(id)));
        if (pendingDeleteRef.current && pendingDeleteRef.current.timeoutId === timeoutId) {
          pendingDeleteRef.current = null;
        }
      };

      const timeoutId = setTimeout(actionWrapperFn, 5000);

      toastId = showToast(
        getToastMessage(timeLeft),
        "success",
        5500,
        { label: "Undo", onClick: undoPendingDelete }
      );

      const intervalId = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft > 0) {
          updateToast(toastId, getToastMessage(timeLeft), "success", { label: "Undo", onClick: undoPendingDelete });
        } else {
          clearInterval(intervalId);
        }
      }, 1000);

      pendingDeleteRef.current = {
        type: "selected",
        deleteType,
        deletedMessages: targetMsgs,
        timeoutId,
        intervalId,
        toastId,
        actionFn: actionWrapperFn
      };

      setIsSelectionMode(false);
      setSelectedMessageIds([]);

    } else if (deleteModalConfig.type === "clear") {
      const backupMessages = [...messages];

      // 1. Optimistic UI update
      setMessages([]);

      // Hide immediately in UI
      const allMessageIds = backupMessages.map(m => m.id);
      setPendingDeleteIds(prev => [...prev, ...allMessageIds]);

      // 2. Setup the actual backend task
      const actionFn = async () => {
        try {
          const res = await messageService.clearConversation(currentConvoId, deleteType);
          if (res.success) {
            if (deleteType === "everyone" && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "clear",
                conversationId: currentConvoId,
                deleteType: "everyone"
              }));
            }
            fetchConversations(false);
          }
        } catch (err) {
          console.error("Delayed clear chat failed:", err);
        }
      };

      // 3. Queue the task and show Toast with Undo
      let timeLeft = 5;
      let toastId = null;

      const getToastMessage = (time) => {
        const typeText = deleteType === "me" ? "for you" : "for everyone";
        return `Chat history will be cleared ${typeText} in ${time}s.`;
      };

      const actionWrapperFn = async () => {
        if (toastId) removeToast(toastId);
        await actionFn();
        setPendingDeleteIds(prev => prev.filter(id => !allMessageIds.includes(id)));
        if (pendingDeleteRef.current && pendingDeleteRef.current.timeoutId === timeoutId) {
          pendingDeleteRef.current = null;
        }
      };

      const timeoutId = setTimeout(actionWrapperFn, 5000);

      toastId = showToast(
        getToastMessage(timeLeft),
        "success",
        5500,
        { label: "Undo", onClick: undoPendingDelete }
      );

      const intervalId = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft > 0) {
          updateToast(toastId, getToastMessage(timeLeft), "success", { label: "Undo", onClick: undoPendingDelete });
        } else {
          clearInterval(intervalId);
        }
      }, 1000);

      pendingDeleteRef.current = {
        type: "clear",
        deleteType,
        deletedMessages: backupMessages,
        timeoutId,
        intervalId,
        toastId,
        actionFn: actionWrapperFn
      };

    } else if (deleteModalConfig.type === "clear_list") {
      const convoId = deleteModalConfig.targetConvoId;
      lastLocalActionTimeRef.current = Date.now();
      // 1. Optimistic Update
      setConversations(prev => prev.filter(c => c.id !== convoId));
      setArchivedConversations(prev => prev.filter(c => c.id !== convoId));
      if (activeConvo?.id === convoId) {
        setActiveConvo(null);
        setMessages([]);
      }
      try {
        const res = await messageService.clearConversation(convoId, "me");
        if (res.success) {
          showToast("Chat deleted successfully.", "success");
          await fetchConversations(false);
        }
      } catch (err) {
        showToast("Failed to delete chat.", "error");
        await fetchConversations(false);
      }
    }
  };

  // Triggers creation or retrieval of a conversation thread with a user
  const handleStartNewChat = async (targetUser) => {
    setMessagesLoading(true);
    try {
      const res = await messageService.getOrCreateConversation(targetUser.id);
      if (res.success) {
        const convo = res.data;
        setSearchQuery("");
        await handleSelectConversation(convo);
        await fetchConversations(false);
      }
    } catch (err) {
      showToast("Failed to initialize conversation thread.", "error");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send a text message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !activeConvo) return;

    const content = newMessageText.trim();
    setNewMessageText(""); // Clear input immediately
    setSendLoading(true);

    try {
      const pin = unlockedConvos[activeConvo.id] || null;
      const res = await messageService.sendMessage(activeConvo.id, content, pin);
      if (res.success) {
        const enriched = parseMessagePayload(res.data);
        setMessages(prev => [...prev, enriched]);
        
        // Dispatch over WebSocket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "message",
            ...enriched
          }));
        }

        fetchConversations(false);
      }
    } catch (err) {
      showToast("Failed to send message.", "error");
      setNewMessageText(content); // Restore content on fail
    } finally {
      setSendLoading(false);
      isNearBottomRef.current = true;
      scrollToBottom(true);
    }
  };

  // Handle file uploads (image/document attachments)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo) return;

    const isImage = file.type.startsWith("image/");
    const messageType = isImage ? "image" : "file";

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;

      // Construct attachment JSON payload
      const attachmentPayload = JSON.stringify({
        _isAttachment: true,
        messageType,
        fileUrl: dataUrl,
        fileName: file.name
      });

      try {
        // Send to backend database API to persist attachment
        const res = await messageService.sendMessage(activeConvo.id, attachmentPayload);
        if (res.success) {
          // Parse/enrich returned message from backend
          const enrichedMsg = {
            ...res.data,
            messageType,
            fileUrl: dataUrl,
            content: file.name
          };

          // Dispatch WebSocket packet
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "message",
              ...enrichedMsg
            }));
          }

          // Add to messages state locally
          setMessages(prev => [...prev, enrichedMsg]);
          isNearBottomRef.current = true;
          scrollToBottom(true);
          showToast(`Attached ${file.name} successfully.`, "success");
          fetchConversations(false);
        }
      } catch (err) {
        showToast("Failed to upload attachment.", "error");
      }

      // Reset file input
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  // Dispatch reaction over WebSocket and update locally
  const handleReact = (messageId, reactionEmoji) => {
    const targetMsg = messages.find(m => m.id === messageId);
    const existingReactions = targetMsg?.reactions || [];
    const userPrevReaction = existingReactions.find(r => r.senderId === currentUser.id);
    const isRemoved = !!(userPrevReaction && userPrevReaction.reaction === reactionEmoji);

    const reactionPacket = {
      type: "reaction",
      messageId,
      reaction: reactionEmoji,
      senderId: currentUser.id,
      isRemoved
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(reactionPacket));
    }

    // Apply reaction locally immediately
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingIdx = reactions.findIndex(r => r.senderId === currentUser.id);
        let updatedReactions = [...reactions];
        
        if (existingIdx > -1) {
          if (updatedReactions[existingIdx].reaction === reactionEmoji) {
            // Remove reaction if clicking the same one again (toggle off)
            updatedReactions.splice(existingIdx, 1);
          } else {
            updatedReactions[existingIdx] = reactionPacket;
          }
        } else {
          updatedReactions.push(reactionPacket);
        }
        return { ...msg, reactions: updatedReactions };
      }
      return msg;
    }));
  };

  // Trigger send on enter press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message bubble time only
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Date headers for message thread grouping
  const getChatDateHeader = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  // Filters available users and existing conversations for matching search targets
  const getFilteredChatItems = () => {
    const query = searchQuery.toLowerCase().trim();

    if (isViewingArchived) {
      const itemsToSearch = archivedConversations;
      if (!query) {
        return { type: "conversations", items: itemsToSearch };
      }
      const matched = itemsToSearch.filter(c => {
        if (c.type === "GROUP") {
          return c.name && c.name.toLowerCase().includes(query);
        } else {
          return c.otherParticipant?.fullName?.toLowerCase().includes(query);
        }
      });
      return { type: "conversations", items: matched };
    }

    if (activeTab === "chats") {
      // Direct Messages Tab
      const dmConvs = conversations.filter(c => c.type !== "GROUP");

      if (!query) {
        // Show conversations with lastMessage
        const activeConvs = dmConvs.filter(c => c.lastMessage !== null && c.lastMessage !== undefined);
        const sortedConvs = [...activeConvs].sort((a, b) => {
          const aPinned = a.pinnedByIds?.includes(currentUser.id) ? 1 : 0;
          const bPinned = b.pinnedByIds?.includes(currentUser.id) ? 1 : 0;
          if (aPinned !== bPinned) {
            return bPinned - aPinned;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        return { type: "conversations", items: sortedConvs };
      }

      // Search users and DMs
      const filteredUsers = availableUsers.filter(u => 
        u.fullName.toLowerCase().includes(query) || 
        (u.company && u.company.toLowerCase().includes(query)) ||
        u.role.toLowerCase().includes(query)
      );

      const mappedItems = filteredUsers.map(user => {
        const existing = dmConvs.find(c => c.otherParticipant?.id === user.id);
        if (existing) {
          return { type: "conversation", data: existing };
        }
        return { type: "new_chat", data: user };
      });

      return { type: "search_results", items: mappedItems };
    } else {
      // Groups Tab
      const groupConvs = conversations.filter(c => c.type === "GROUP");

      if (!query) {
        const sortedGroups = [...groupConvs].sort((a, b) => {
          const aPinned = a.pinnedByIds?.includes(currentUser.id) ? 1 : 0;
          const bPinned = b.pinnedByIds?.includes(currentUser.id) ? 1 : 0;
          if (aPinned !== bPinned) {
            return bPinned - aPinned;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        return { type: "groups", items: sortedGroups };
      }

      // Search matching groups
      const matchedGroups = groupConvs.filter(g => 
        g.name && g.name.toLowerCase().includes(query)
      );
      return { type: "groups", items: matchedGroups };
    }
  };

  const { type: displayType, items: listItems } = getFilteredChatItems();

  const getFilteredEmojis = () => {
    if (!emojiSearch.trim()) {
      const cat = EMOJI_CATEGORIES.find(c => c.name === activeCategory);
      return cat ? cat.emojis : [];
    }
    const query = emojiSearch.toLowerCase().trim();
    const matched = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const emoji of cat.emojis) {
        const kw = EMOJI_KEYWORDS[emoji] || "";
        if (kw.includes(query) || cat.name.includes(query)) {
          matched.push(emoji);
        }
      }
    }
    return Array.from(new Set(matched));
  };

  const displayedEmojis = getFilteredEmojis();

  const getAllReactionEmojisFiltered = () => {
    const all = [];
    for (const cat of EMOJI_CATEGORIES) {
      all.push(...cat.emojis);
    }
    const unique = Array.from(new Set(all));
    if (!reactionSearch.trim()) {
      return unique;
    }
    const query = reactionSearch.toLowerCase().trim();
    return unique.filter(emoji => {
      const kw = EMOJI_KEYWORDS[emoji] || "";
      return kw.includes(query);
    });
  };

  const displayedReactionEmojis = getAllReactionEmojisFiltered();

  // Renders the bubble media preview or file download link
  const renderBubbleContent = (message) => {
    if (message.content === "[deleted_for_everyone]" || message.content === "[deleted_by_admin]") {
      const isOwn = message.senderId === currentUser.id;
      const text = message.content === "[deleted_by_admin]" 
        ? "This message was deleted by admin"
        : (isOwn ? "You deleted this message" : "This message was deleted by author");
      return (
        <div className="w-full text-left leading-relaxed font-normal italic text-slate-400 select-none flex items-center gap-1.5">
          <span className="text-[10px]">🚫</span> {text}
        </div>
      );
    }

    const isImg = message.messageType === "image" || (message.fileUrl && message.fileUrl.startsWith("data:image/"));
    
    if (isImg) {
      return (
        <div className="group/attach relative rounded-xl overflow-hidden max-w-xs border border-slate-200 bg-slate-50">
          <a href={message.fileUrl} download={message.content} className="block cursor-pointer">
            <img 
              src={message.fileUrl} 
              alt={message.content || "Attachment"} 
              className="w-full h-auto object-cover max-h-48 hover:opacity-95 transition-opacity" 
              onLoad={() => {
                const isOwnMsg = message.senderId === currentUser.id;
                if (isOwnMsg) {
                  scrollToBottom(true);
                } else if (isNearBottomRef.current) {
                  scrollToBottom(false);
                }
              }}
            />
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewAttachment({ url: message.fileUrl, type: "image", name: message.content });
            }}
            className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover/attach:opacity-100 transition-opacity cursor-pointer flex items-center justify-center shadow-xs border-none"
            title="Preview Image"
           aria-label="Preview Image">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    const isDoc = message.messageType === "file" || message.fileUrl;
    if (isDoc) {
      return (
        <div className="group/attach relative">
          <a 
            href={message.fileUrl} 
            download={message.content}
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-2 bg-slate-100/70 hover:bg-slate-100 rounded-xl transition-colors text-indigo-700 font-bold border border-slate-200/50 no-underline text-xs pr-9"
          >
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[160px]" title={message.content}>{message.content}</span>
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewAttachment({ url: message.fileUrl, type: "file", name: message.content });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-md opacity-0 group-hover/attach:opacity-100 transition-opacity cursor-pointer flex items-center justify-center shadow-xs border-none"
            title="Preview Document"
           aria-label="Preview Document">
            <Eye className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return <div className="w-full text-left leading-relaxed font-medium">{message.content}</div>;
  };

  const renderLastMessageContent = (lastMessage) => {
    if (!lastMessage) return "Start a new conversation";
    if (lastMessage.content === "[deleted_for_everyone]" || lastMessage.content === "[deleted_by_admin]") {
      const isOwn = lastMessage.senderId === currentUser.id;
      return lastMessage.content === "[deleted_by_admin]"
        ? "🚫 Message deleted by admin"
        : (isOwn ? "🚫 You deleted this message" : "🚫 Message was deleted");
    }
    let displayContent = lastMessage.content;
    if (displayContent && displayContent.startsWith("__SYSTEM_PRIVATE__:")) {
      const parts = displayContent.split(":");
      displayContent = parts.slice(2).join(":");
    } else if (displayContent && displayContent.startsWith("__SYSTEM__:")) {
      displayContent = displayContent.replace("__SYSTEM__:", "");
    }
    const prefix = lastMessage.senderId === currentUser.id ? "You: " : "";
    return `${prefix}${displayContent}`;
  };

  return (
    <div className="font-sans grid grid-cols-1 md:grid-cols-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden h-[calc(100vh-10rem)] md:h-[calc(100vh-11.5rem)]">
      
      {/* ==================== LEFT COLUMN: MESSAGES LIST / SEARCH ==================== */}
      <div className={`md:col-span-1 border-r border-slate-200/85 flex flex-col h-full overflow-hidden bg-slate-50/20 ${activeConvo ? "hidden md:flex" : "flex"}`}>
        
        {/* Search Header or Archived Header */}
        {isViewingArchived ? (
          <div className="p-4 border-b border-slate-200 bg-white shrink-0 text-left flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsViewingArchived(false)}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer bg-transparent border-none shrink-0"
              aria-label="Back to main chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Archived Chats
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {archivedConversations.length} conversation{archivedConversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 bg-white shrink-0 text-left">
            {/* Tabs switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("chats");
                setSearchQuery("");
              }}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${
                activeTab === "chats"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-805 bg-transparent"
              }`}
            >
              Private Chats
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("groups");
                setSearchQuery("");
              }}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${
                activeTab === "groups"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-805 bg-transparent"
              }`}
            >
              Group Chats
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {activeTab === "chats" ? "Chats" : "Groups"}
            </h2>
            {activeTab === "groups" && (
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-all border-none shrink-0"
              >
                + Create Group
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "chats" ? "Search people to chat..." : "Search group chats..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-250 rounded-xl bg-slate-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold chat-search-input"
             aria-label="Search people to chat..."/>
          </div>
        </div>
      )}

        {/* Channels/Users List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 no-scrollbar">
          {!isViewingArchived && archivedConversations.length > 0 && !convoLoading && (
            <button
              type="button"
              onClick={() => {
                setIsViewingArchived(true);
                setSearchQuery("");
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 cursor-pointer shadow-3xs mb-2 text-left shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-505 shrink-0">
                <Archive className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Archived</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Chats that are archived</p>
              </div>
            </button>
          )}

          {convoLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400 font-semibold">Loading conversation feeds...</span>
            </div>
          ) : listItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-semibold mt-4">
              {searchQuery ? "No matching users found." : "No active chat conversations yet."}
            </div>
          ) : (
            listItems.map((item, idx) => {
              if (displayType === "conversations") {
                const isSelected = activeConvo?.id === item.id;
                const other = item.otherParticipant;
                const isPinned = item.pinnedByIds?.includes(currentUser.id);
                
                return (
                  <div
                    key={`convo-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectConversation(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectConversation(item);
                      }
                    }}
                    className={`group relative w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border outline-none ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-100/80 shadow-3xs" 
                        : "border-transparent hover:bg-slate-100/70"
                    }`}
                  >
                    <Avatar name={other?.fullName} src={other?.avatar} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-800"} flex items-center gap-1`}>
                            {other?.fullName}
                            {item.isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          </h4>
                          <span className={`text-[9px] px-1 rounded uppercase font-bold tracking-wide scale-90 origin-left shrink-0 ${
                            isSelected 
                              ? "text-indigo-700 bg-white border border-indigo-200/50" 
                              : "text-indigo-700 bg-indigo-50 border border-indigo-200/40"
                          }`}>
                            {other?.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPinned && (
                            <Pin className="w-2.5 h-2.5 text-indigo-650 fill-indigo-650 transform -rotate-45 shrink-0" />
                          )}
                          <span className={`text-[9px] font-bold shrink-0 transition-opacity duration-150 ${
                            isSelected ? "text-indigo-500/90" : "text-slate-400"
                          } group-hover:opacity-0`}>
                            {item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>

                      <p className={`text-[11px] truncate mt-1.5 leading-snug ${isSelected ? "text-indigo-900/75 font-medium" : "text-slate-500 font-medium"}`}>
                        {renderLastMessageContent(item.lastMessage)}
                      </p>
                    </div>

                    {item.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shadow-xs bg-indigo-600 text-white transition-opacity duration-150 group-hover:opacity-0">
                        {item.unreadCount}
                      </span>
                    )}

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDropdown(e, item);
                        }}
                        className="archive-options-trigger p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 rounded-lg cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center"
                        title="Chat Options"
                        aria-label="Chat Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              } else if (displayType === "groups") {
                const isSelected = activeConvo?.id === item.id;
                const isPinned = item.pinnedByIds?.includes(currentUser.id);
                
                return (
                  <div
                    key={`group-convo-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectConversation(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectConversation(item);
                      }
                    }}
                    className={`group relative w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-100/80 shadow-3xs" 
                        : "border-transparent hover:bg-slate-100/70"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      isSelected ? "bg-indigo-600" : "bg-indigo-600/70"
                    }`}>
                      {item.name ? item.name.substring(0, 2).toUpperCase() : "GP"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-800"} flex items-center gap-1`}>
                            {item.name}
                            {item.isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          </h4>
                          <span className={`text-[8px] px-1 rounded uppercase font-bold tracking-wide scale-90 origin-left shrink-0 ${
                            isSelected 
                              ? "text-indigo-700 bg-white border border-indigo-200/50" 
                              : "text-indigo-700 bg-indigo-50 border border-indigo-200/40"
                          }`}>
                            {item.participants?.length || 0} members
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPinned && (
                            <Pin className="w-2.5 h-2.5 text-indigo-650 fill-indigo-650 transform -rotate-45 shrink-0" />
                          )}
                          <span className={`text-[9px] font-bold shrink-0 transition-opacity duration-150 ${
                            isSelected ? "text-indigo-500/90" : "text-slate-400"
                          } group-hover:opacity-0`}>
                            {item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>

                      <p className={`text-[11px] truncate mt-1.5 leading-snug ${isSelected ? "text-indigo-900/75 font-medium" : "text-slate-500 font-medium"}`}>
                        {renderLastMessageContent(item.lastMessage)}
                      </p>
                    </div>

                    {item.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shadow-xs bg-indigo-600 text-white transition-opacity duration-150 group-hover:opacity-0">
                        {item.unreadCount}
                      </span>
                    )}

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDropdown(e, item);
                        }}
                        className="archive-options-trigger p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 rounded-lg cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center"
                        title="Chat Options"
                        aria-label="Chat Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              } else {
                const isExisting = item.type === "conversation";
                const target = isExisting ? item.data.otherParticipant : item.data;
                const isSelected = isExisting && activeConvo?.id === item.data.id;

                return (
                  <div
                    key={`search-res-${idx}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => isExisting ? handleSelectConversation(item.data) : handleStartNewChat(target)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (isExisting) {
                          handleSelectConversation(item.data);
                        } else {
                          handleStartNewChat(target);
                        }
                      }
                    }}
                    className={`group relative w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border outline-none ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-100/80 shadow-3xs" 
                        : "border-transparent hover:bg-slate-100/70"
                    }`}
                  >
                    <Avatar name={target?.fullName} src={target?.avatar} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-800"} flex items-center gap-1`}>
                            {target?.fullName}
                            {isExisting && item.data.isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          </h4>
                          <span className={`text-[9px] px-1 rounded uppercase font-bold tracking-wide scale-90 origin-left shrink-0 ${
                            isSelected 
                              ? "text-indigo-700 bg-white border border-indigo-200/50" 
                              : "text-indigo-700 bg-indigo-50 border border-indigo-200/40"
                          }`}>
                            {target?.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isExisting && item.data.pinnedByIds?.includes(currentUser.id) && (
                            <Pin className="w-2.5 h-2.5 text-indigo-650 fill-indigo-650 transform -rotate-45 shrink-0" />
                          )}
                          <span className={`text-[9px] font-bold shrink-0 transition-opacity duration-150 ${
                            isSelected ? "text-indigo-500/90" : "text-slate-400"
                          } ${isExisting ? "group-hover:opacity-0" : ""}`}>
                            {isExisting && item.data.lastMessage ? new Date(item.data.lastMessage.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>

                      <p className={`text-[11px] truncate mt-1.5 leading-snug ${
                        isSelected ? "text-indigo-900/75 font-semibold" : "text-indigo-600 font-bold"
                      }`}>
                        {isExisting ? renderLastMessageContent(item.data.lastMessage) : "Start new conversation"}
                      </p>
                    </div>

                    {isExisting && item.data.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shadow-xs bg-indigo-600 text-white transition-opacity duration-150 group-hover:opacity-0">
                        {item.data.unreadCount}
                      </span>
                    )}

                    {isExisting && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDropdown(e, item.data);
                          }}
                          className="archive-options-trigger p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 rounded-lg cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center"
                          title="Chat Options"
                          aria-label="Chat Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* ==================== RIGHT COLUMN: CHAT FEED AREA ==================== */}
      <div className={`md:col-span-2 flex flex-col h-full overflow-hidden bg-white relative ${activeConvo ? "flex" : "hidden md:flex"}`}>
        
        {activeConvo ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-200/85 bg-white flex items-center justify-between shrink-0 text-left">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="md:hidden p-1 text-slate-500 hover:text-slate-850 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors mr-1 border-none bg-transparent"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {activeConvo.type === "GROUP" ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-600 shrink-0">
                    {activeConvo.name ? activeConvo.name.substring(0, 2).toUpperCase() : "GP"}
                  </div>
                ) : (
                  <Avatar name={activeConvo.otherParticipant?.fullName} src={activeConvo.otherParticipant?.avatar} size="sm" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm">
                      {activeConvo.type === "GROUP" ? activeConvo.name : activeConvo.otherParticipant?.fullName}
                    </h3>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-1 rounded uppercase tracking-wide">
                      {activeConvo.type === "GROUP" ? `${activeConvo.participants?.length || 0} members` : activeConvo.otherParticipant?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Actions Dropdown Menu / Selection Status */}
              <div className="flex items-center gap-2 border-none">
                {activeConvo.type === "GROUP" && (
                  <button
                    type="button"
                    onClick={() => setShowGroupInfoDrawer(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer border-none bg-transparent"
                    title="Group Info"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                )}
                {isSelectionMode ? (
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedMessageIds([]);
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors border-none"
                  >
                    Cancel Selection
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border-none bg-transparent"
                      aria-label="Chat actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {showMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSelectionMode(true);
                              setSelectedMessageIds([]);
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                            Select Messages
                          </button>
                           <button
                            type="button"
                            onClick={() => {
                              setShowMenu(false);
                              handleLockMenuClick();
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                          >
                            {activeConvo.isLocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-slate-500" />
                                Remove Chat Lock
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                Lock Chat with PIN
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowMenu(false);
                              triggerClearChat();
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Clear Chat
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {activeConvo.isLocked && !unlockedConvos[activeConvo.id] ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/20 p-6">
                {isResettingPin ? (
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                      <KeyRound className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-slate-800 text-sm">Reset Chat PIN</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Verify your account password to set a new PIN.
                      </p>
                    </div>

                    <form onSubmit={handleResetPinSubmit} className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Password</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Enter account password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New 4-digit PIN</label>
                        <div className="flex gap-2 justify-start">
                          {[0, 1, 2, 3].map((idx) => (
                            <input
                              key={idx}
                              id={`pin-reset-${idx}`}
                              type="password"
                              maxLength={1}
                              pattern="\d*"
                              className="w-10 h-10 text-center text-md font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                              value={resetNewPin[idx] || ""}
                              onChange={(e) => handleResetPinChange(e.target.value, idx, false)}
                              onKeyDown={(e) => handleResetPinKeyDown(e, idx, false)}
                              required
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New PIN</label>
                        <div className="flex gap-2 justify-start">
                          {[0, 1, 2, 3].map((idx) => (
                            <input
                              key={idx}
                              id={`pin-reset-confirm-${idx}`}
                              type="password"
                              maxLength={1}
                              pattern="\d*"
                              className="w-10 h-10 text-center text-md font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                              value={resetConfirmPin[idx] || ""}
                              onChange={(e) => handleResetPinChange(e.target.value, idx, true)}
                              onKeyDown={(e) => handleResetPinKeyDown(e, idx, true)}
                              required
                            />
                          ))}
                        </div>
                      </div>

                      {resetError && <p className="text-rose-600 text-[11px] font-semibold">{resetError}</p>}

                      <div className="flex gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsResettingPin(false);
                            setResetError("");
                          }}
                          className="px-3 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs bg-white hover:bg-slate-50 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!resetPassword || resetNewPin.some(c => !c) || resetConfirmPin.some(c => !c) || resetLoading}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: "var(--cta-bg, #4F46E5)" }}
                        >
                          {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset PIN"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-slate-800 text-sm">Chat Locked</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Enter the 4-digit PIN to unlock this conversation.
                      </p>
                    </div>
                    
                    <form onSubmit={handleUnlockSubmit} className="space-y-4">
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            id={`pin-unlock-${idx}`}
                            type="password"
                            maxLength={1}
                            pattern="\d*"
                            className="w-12 h-12 text-center text-lg font-bold border border-slate-205 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={unlockPin[idx] || ""}
                            onChange={(e) => handleUnlockPinChange(e.target.value, idx)}
                            onKeyDown={(e) => handleUnlockPinKeyDown(e, idx)}
                            required
                          />
                        ))}
                      </div>
                      {unlockError && <p className="text-rose-600 text-[11px] font-semibold">{unlockError}</p>}
                      <button
                        type="submit"
                        disabled={unlockPin.some(c => !c) || unlockLoading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ backgroundColor: "var(--cta-bg, #4F46E5)" }}
                      >
                        {unlockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Conversation"}
                      </button>
                      
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsResettingPin(true);
                            setResetError("");
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-transparent border-none cursor-pointer"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Pinned Message Bar */}
                {activeConvo?.pinnedMessageId && activeConvo?.pinnedMessage && (
                  <div 
                    onClick={handleScrollToPinned}
                    className="bg-indigo-50/50 border-b border-indigo-100/70 border-l-4 border-l-indigo-600 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-indigo-50/80 transition-all text-left shrink-0 select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Pin className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 shrink-0 transform -rotate-45" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-700 block tracking-wide uppercase">
                          Pinned Message
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium truncate block max-w-lg">
                          <strong className="text-slate-800 mr-1.5 font-bold">
                            {activeConvo.pinnedMessage.sender?.id === currentUser.id 
                              ? "You" 
                              : (activeConvo.pinnedMessage.sender?.fullName || "Participant")}
                            :
                          </strong>
                          {activeConvo.pinnedMessage.content}
                        </span>
                      </div>
                    </div>
                    
                    {/* Close Button / Unpin Trigger */}
                    {(!activeConvo.type || activeConvo.type !== "GROUP" || activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpinMessage();
                        }}
                        className="p-1.5 hover:bg-indigo-100/40 hover:text-indigo-900 rounded-lg text-slate-405 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                        title="Unpin message"
                        aria-label="Unpin message"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Message Thread History Feed */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleContainerScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-5.5 space-y-5 bg-slate-50/15 scrollbar-style"
            >
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400 font-semibold">Loading message thread...</span>
                </div>
              ) : (() => {
                const visibleMessages = messages.filter(m => {
                  if (pendingDeleteIds.includes(m.id)) return false;
                  if (m.content && m.content.startsWith("__SYSTEM_PRIVATE__:")) {
                    const parts = m.content.split(":");
                    const targetId = Number(parts[1]);
                    return targetId === currentUser.id;
                  }
                  return true;
                });
                if (visibleMessages.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 text-slate-200 mb-2" />
                      <p className="text-xs font-semibold">No messages yet. Send a message to start chatting.</p>
                    </div>
                  );
                }
                let lastDateHeader = "";
                return visibleMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUser.id;
                  const isGroupConvo = activeConvo?.type === "GROUP";
                  const isUserGroupAdmin = isGroupConvo && (activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN");
                  const canDeleteMsg = isOwn || isUserGroupAdmin || message.content === "[deleted_for_everyone]" || message.content === "[deleted_by_admin]";

                  const currentDateHeader = getChatDateHeader(message.createdAt);
                  const showDateSeparator = currentDateHeader !== lastDateHeader;
                  lastDateHeader = currentDateHeader;

                  if (message.isSystem || (message.content && (message.content.startsWith("__SYSTEM__:") || message.content.startsWith("__SYSTEM_PRIVATE__:")))) {
                    let systemText = message.content;
                    if (systemText.startsWith("__SYSTEM_PRIVATE__:")) {
                      const parts = systemText.split(":");
                      systemText = parts.slice(2).join(":");
                    } else if (systemText.startsWith("__SYSTEM__:")) {
                      systemText = systemText.replace("__SYSTEM__:", "");
                    }
                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="bg-slate-200/50 text-slate-500 text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                              {currentDateHeader}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-center my-2.5 select-none px-4 text-center">
                          <span className="bg-slate-100/90 text-slate-500 text-[10px] sm:text-xs font-semibold px-3.5 py-1 rounded-full border border-slate-200 shadow-3xs max-w-[85%] break-words">
                            {systemText}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  }

                  // Check if message has reactions to allocate bottom-margin padding
                  const hasReactions = message.reactions && message.reactions.length > 0;

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="bg-slate-200/50 text-slate-500 text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                              {currentDateHeader}
                            </span>
                          </div>
                        )}
                        <div 
                          id={`msg-${message.id}`}
                          onMouseLeave={() => {
                            setActiveReactionPickerId(null);
                            setActiveAllReactionsPickerId(null);
                            setReactionSearch("");
                          }}
                          onClick={() => {
                            if (isSelectionMode) {
                              const diffMin = (new Date() - new Date(message.createdAt)) / 1000 / 60;
                              if (diffMin <= DELETE_LIMIT_MINUTES) {
                                handleToggleSelectMessage(message.id);
                              }
                            }
                          }}
                          className={`group relative flex ${isOwn ? "justify-end" : "justify-start"} items-start gap-2.5 sm:gap-3 ${hasReactions ? "pb-4 mb-1" : "pb-1"} ${
                            isSelectionMode ? "cursor-pointer select-none" : ""
                          }`}
                        >
                          {isSelectionMode && (() => {
                            const diffMin = (new Date() - new Date(message.createdAt)) / 1000 / 60;
                            if (diffMin > DELETE_LIMIT_MINUTES) return null;
                            return (
                              <div className="self-center mr-2 shrink-0">
                                {selectedMessageIds.includes(message.id) ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600 animate-in zoom-in-75 duration-75" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                                )}
                              </div>
                            );
                          })()}

                          {!isOwn && (
                            <Avatar name={message.sender?.fullName || "Deleted User"} src={message.sender?.avatar} size="xs" className="mt-1" />
                          )}

                          <div className={`space-y-1 flex-1 min-w-0 flex flex-col ${isOwn ? "items-end text-right" : "items-start text-left"}`}>
                            <div className={`flex items-baseline gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                isOwn ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                              }`}>
                                {isOwn ? currentUser.role : (message.sender?.role || "USER")}
                              </span>
                              <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                                {isOwn ? currentUser.fullName : (message.sender?.fullName || "Deleted User")}
                              </span>
                            </div>
                            
                            {/* Flex container wrapping WhatsApp reaction trigger and chat bubble */}
                            <div className={`flex items-center gap-2 w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                              
                              {/* Sent messages trigger on the left */}
                              {isOwn && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {(!isGroupConvo || isUserGroupAdmin) && message.content !== "[deleted_for_everyone]" && message.content !== "[deleted_by_admin]" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeConvo?.pinnedMessageId === message.id) {
                                          handleUnpinMessage();
                                        } else {
                                          handlePinMessage(message.id);
                                        }
                                      }}
                                      className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center ${
                                        activeConvo?.pinnedMessageId === message.id
                                          ? "text-indigo-600 hover:text-indigo-850 hover:bg-indigo-50"
                                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                      }`}
                                      title={activeConvo?.pinnedMessageId === message.id ? "Unpin message" : "Pin message"}
                                      aria-label={activeConvo?.pinnedMessageId === message.id ? "Unpin message" : "Pin message"}
                                    >
                                      <Pin className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {!isSelectionMode && (() => {
                                    const diffMin = (new Date() - new Date(message.createdAt)) / 1000 / 60;
                                    if (diffMin > DELETE_LIMIT_MINUTES) return null;
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerDeleteSingleMessage(message.id, isOwn);
                                        }}
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center"
                                        title="Delete message" aria-label="Delete message">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })()}

                                  {message.content !== "[deleted_for_everyone]" && message.content !== "[deleted_by_admin]" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveReactionPickerId(activeReactionPickerId === message.id ? null : message.id);
                                      }}
                                      className="reaction-trigger-button opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center" title="React" aria-label="React"
                                    >
                                      <Smile className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Chat bubble enclosing text/file content and reactions container wrapped in vertical layout */}
                              <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
                                <div className={`relative border p-2.5 sm:p-3 shadow-2xs text-slate-700 text-[11px] sm:text-xs w-full text-left whitespace-pre-wrap flex flex-col items-end ${
                                  isOwn 
                                    ? "bg-[#EFF6FF] border-blue-100 rounded-2xl rounded-tr-none" 
                                    : "bg-white border-slate-200 rounded-2xl rounded-tl-none"
                                }`}>
                                  {/* WhatsApp Reaction Picker Overlay */}
                                  {activeReactionPickerId === message.id && (
                                    <div className={`reaction-picker-overlay flex items-center gap-1.5 bg-white border border-slate-200 rounded-full shadow-md px-2.5 py-1 absolute ${
                                      index < 3 ? "top-full mt-2" : "-top-9"
                                    } ${isOwn ? "right-2" : "left-2"} z-50 animate-scale-up select-none`}>
                                      {REACTION_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReact(message.id, emoji);
                                            setActiveReactionPickerId(null);
                                          }}
                                          className="hover:scale-130 active:scale-95 transition-transform text-xs cursor-pointer p-0.5 border-none bg-transparent"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                      {/* plus trigger to show all emojis */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveAllReactionsPickerId(activeAllReactionsPickerId === message.id ? null : message.id);
                                        }}
                                        className="hover:scale-130 active:scale-95 transition-transform text-[11px] cursor-pointer p-0.5 border-none bg-transparent text-slate-500 font-bold ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-100"
                                        title="More reactions"
                                       aria-label="More reactions">
                                        +
                                      </button>
                                    </div>
                                  )}

                                  {/* WhatsApp React with ANY Emoji Sub-Picker */}
                                  {activeAllReactionsPickerId === message.id && (
                                    <div className={`all-reactions-picker-overlay bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 flex flex-col w-56 h-48 absolute ${
                                      index < 3 ? "top-full mt-11" : "bottom-full mb-10"
                                    } ${isOwn ? "right-2" : "left-2"} animate-scale-up text-left`}>
                                      <input
                                        type="text"
                                        placeholder="Search reaction..."
                                        value={reactionSearch}
                                        onChange={(e) => setReactionSearch(e.target.value)}
                                        className="w-full px-2.5 py-1.5 mb-1.5 text-[10px] border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                                        onClick={(e) => e.stopPropagation()} // Prevent close on input click
                                       aria-label="Search reaction..."/>
                                      <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-6 gap-1 no-scrollbar">
                                        {displayedReactionEmojis.map((emoji) => (
                                          <button
                                            key={`react-all-${emoji}`}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReact(message.id, emoji);
                                              setActiveAllReactionsPickerId(null);
                                              setActiveReactionPickerId(null);
                                              setReactionSearch("");
                                            }}
                                            className="w-6.5 h-6.5 flex items-center justify-center text-sm rounded hover:bg-slate-50 cursor-pointer transition-colors border-none bg-transparent"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {renderBubbleContent(message)}
                                  
                                  <div className="flex items-center gap-1 mt-1 self-end select-none">
                                    {activeConvo?.pinnedMessageId === message.id && (
                                      <Pin className="w-2.5 h-2.5 text-indigo-550 fill-indigo-550 shrink-0" />
                                    )}
                                    <span className={`text-[8px] sm:text-[9px] font-normal select-none ${
                                      isOwn ? "text-blue-400/85" : "text-slate-400"
                                    } tracking-wide`}>
                                      {formatTimeOnly(message.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Persistent Emojis Reactions list rendered down/under the message bubble clearly */}
                                {hasReactions && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const userReaction = message.reactions.find(r => r.senderId === currentUser.id);
                                      if (userReaction) {
                                        handleReact(message.id, userReaction.reaction);
                                      }
                                    }}
                                    className={`mt-1.5 flex items-center gap-1.5 bg-white border border-slate-200/95 rounded-full px-2 py-0.5 shadow-3xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer select-none animate-fade-in ${
                                      isOwn ? "self-end mr-1" : "self-start ml-1"
                                    }`}
                                    title="Click to remove your reaction"
                                   aria-label="Click to remove your reaction">
                                    <span className="flex items-center gap-0.5 select-none">
                                      {Array.from(new Set(message.reactions.map(r => r.reaction))).map(emoji => (
                                        <span key={emoji} className="text-xs select-none">{emoji}</span>
                                      ))}
                                    </span>
                                    {message.reactions.length > 0 && (
                                      <span className="text-[10px] font-bold text-slate-500 pl-0.5 select-none">
                                        {message.reactions.length}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Received messages trigger on the right */}
                              {!isOwn && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {message.content !== "[deleted_for_everyone]" && message.content !== "[deleted_by_admin]" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveReactionPickerId(activeReactionPickerId === message.id ? null : message.id);
                                      }}
                                      className="reaction-trigger-button opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center" title="React" aria-label="React"
                                    >
                                      <Smile className="w-4 h-4" />
                                    </button>
                                  )}

                                  {(!isGroupConvo || isUserGroupAdmin) && message.content !== "[deleted_for_everyone]" && message.content !== "[deleted_by_admin]" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeConvo?.pinnedMessageId === message.id) {
                                          handleUnpinMessage();
                                        } else {
                                          handlePinMessage(message.id);
                                        }
                                      }}
                                      className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center ${
                                        activeConvo?.pinnedMessageId === message.id
                                          ? "text-indigo-600 hover:text-indigo-850 hover:bg-indigo-50"
                                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                      }`}
                                      title={activeConvo?.pinnedMessageId === message.id ? "Unpin message" : "Pin message"}
                                      aria-label={activeConvo?.pinnedMessageId === message.id ? "Unpin message" : "Pin message"}
                                    >
                                      <Pin className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {!isSelectionMode && (() => {
                                    const diffMin = (new Date() - new Date(message.createdAt)) / 1000 / 60;
                                    if (diffMin > DELETE_LIMIT_MINUTES) return null;
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerDeleteSingleMessage(message.id, isOwn);
                                        }}
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full cursor-pointer bg-transparent border-none shrink-0 flex items-center justify-center"
                                        title="Delete message" aria-label="Delete message">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })()}
                                </div>
                              )}

                            </div>


                          </div>

                          {isOwn && (
                            <Avatar name={currentUser.fullName} src={currentUser.avatar} size="xs" className="mt-1" />
                          )}
                        </div>
                      </React.Fragment>
                    );
                  });
                })()
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Editor (Fixed at bottom) */}
            {isSelectionMode ? (
              <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-50 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                    {selectedMessageIds.length} selected
                  </span>
                  {selectedMessageIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMessageIds([])}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Deselect all
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedMessageIds([]);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={triggerDeleteSelectedMessages}
                    disabled={selectedMessageIds.length === 0}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl cursor-pointer hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 border-none shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                </div>
              </div>
            ) : (
              /* Message Composer Editor (with file attachment and emoji picker overlay) */
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 shrink-0 bg-white relative">
                
                {/* Emoji Picker Dropdown Overlay */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-18 left-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 flex flex-col w-72 h-80 animate-scale-up text-left">
                    {/* Category Tabs */}
                    <div className="flex justify-between border-b border-slate-100 pb-1.5 mb-1.5 shrink-0 overflow-x-auto no-scrollbar gap-1 select-none">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setActiveCategory(cat.name);
                            setEmojiSearch("");
                          }}
                          className={`p-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer transition-colors border-none bg-transparent ${
                            activeCategory === cat.name && !emojiSearch ? "bg-slate-100 scale-110" : "opacity-60"
                          }`}
                          title={cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                         aria-label={cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}>
                          {cat.icon}
                        </button>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-2 shrink-0">
                      <input
                        type="text"
                        placeholder="Search emojis..."
                        value={emojiSearch}
                        onChange={(e) => setEmojiSearch(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-semibold"
                       aria-label="Search emojis..."/>
                    </div>

                    {/* Emojis Grid */}
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-7 gap-1.5 no-scrollbar">
                      {displayedEmojis.length === 0 ? (
                        <div className="col-span-7 text-center text-[10px] text-slate-400 py-6 font-semibold select-none">
                          No matching emojis.
                        </div>
                      ) : (
                        displayedEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessageText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                              setEmojiSearch("");
                              setTimeout(() => {
                                if (textareaRef.current) {
                                  textareaRef.current.focus();
                                  const len = textareaRef.current.value.length;
                                  textareaRef.current.setSelectionRange(len, len);
                                }
                              }, 50);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-base rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border-none bg-transparent"
                          >
                            {emoji}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl flex items-center bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:border-indigo-500 focus-within:ring-indigo-500/10 transition-all p-1">
                  
                  {/* File Attachment Clip trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-slate-850 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors bg-transparent border-none shrink-0"
                    aria-label="Attach media"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />

                  {/* Smiley emoji trigger */}
                  <button
                    ref={emojiTriggerRef}
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-slate-500 hover:text-slate-850 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors bg-transparent border-none shrink-0"
                    aria-label="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows="1"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message here..."
                    className="flex-1 px-3 py-2 text-xs outline-none border-none font-semibold resize-none bg-transparent placeholder-slate-400 text-slate-700 min-h-[36px] max-h-[120px] self-center chat-composer-textarea"
                    disabled={sendLoading}
                    required
                   aria-label="Type a message here..."/>

                  <button
                    type="submit"
                    disabled={sendLoading || !newMessageText.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors border-none shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center mr-1"
                    aria-label="Send message"
                    style={{ backgroundColor: "var(--cta-bg, #4F46E5)" }}
                  >
                    {sendLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Floating "Scroll to bottom" button (WhatsApp style) */}
            {showScrollToBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-6 z-50 flex items-center justify-center w-8.5 h-8.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer select-none animate-fade-in"
                title="Scroll to bottom"
               aria-label="Scroll to bottom">
                <ArrowDown className="w-4 h-4" />
              </button>
            )}

            {/* Custom stylesheet for smooth WhatsApp scrollbars */}
            <style>{`
              .scrollbar-style::-webkit-scrollbar {
                width: 6px;
              }
              .scrollbar-style::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-style::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 9999px;
              }
              .scrollbar-style::-webkit-scrollbar-thumb:hover {
                background-color: #94a3b8;
              }
            `}</style>
              </>
            )}
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <h3 className="font-display font-extrabold text-slate-800 text-sm">Select a Conversation</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mt-1">
              Choose an existing chat thread or search users to launch a new message thread.
            </p>
          </div>
        )}
      </div>

      {/* Lock / Unlock Configuration Modal */}
      {showLockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                {lockModalConfig.mode === "lock" ? <Lock className="w-5 h-5 text-indigo-600" /> : <Unlock className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lockModalConfig.mode === "lock" ? "Lock Chat with PIN" : "Remove Chat Lock"}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  {lockModalConfig.mode === "lock" ? (conversations.some(c => c.isLocked) ? "Enter existing Chat PIN" : "Set a 4-digit PIN") : "Enter PIN to confirm"}
                </p>
              </div>
            </div>

            <form onSubmit={handleLockModalSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  {lockModalConfig.mode === "lock" ? (conversations.some(c => c.isLocked) ? "Chat PIN" : "Choose PIN") : "Current PIN"}
                </label>
                <div className="flex justify-start gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      id={`pin-lock-${idx}`}
                      type="password"
                      maxLength={1}
                      pattern="\d*"
                      className="w-10 h-10 text-center text-md font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none animate-none"
                      value={lockModalPin[idx] || ""}
                      onChange={(e) => handleLockPinChange(e.target.value, idx, false)}
                      onKeyDown={(e) => handleLockPinKeyDown(e, idx, false)}
                      required
                    />
                  ))}
                </div>
              </div>

              {lockModalConfig.mode === "lock" && !conversations.some(c => c.isLocked) && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Confirm PIN</label>
                  <div className="flex justify-start gap-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        id={`pin-lock-confirm-${idx}`}
                        type="password"
                        maxLength={1}
                        pattern="\d*"
                        className="w-10 h-10 text-center text-md font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none animate-none"
                        value={lockModalConfirmPin[idx] || ""}
                        onChange={(e) => handleLockPinChange(e.target.value, idx, true)}
                        onKeyDown={(e) => handleLockPinKeyDown(e, idx, true)}
                        required
                      />
                    ))}
                  </div>
                </div>
              )}

              {lockModalError && (
                <p className="text-rose-600 text-xs font-semibold">{lockModalError}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs bg-white hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lockModalPin.some(c => !c) || (lockModalConfig.mode === "lock" && !conversations.some(c => c.isLocked) && lockModalConfirmPin.some(c => !c)) || lockModalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer border-none disabled:opacity-50"
                  style={{ backgroundColor: "var(--cta-bg, #4F46E5)" }}
                >
                  {lockModalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : lockModalConfig.mode === "lock" ? "Lock Chat" : "Unlock Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Option Custom Modal Popup */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {deleteModalConfig.type === "single" && "Delete Message?"}
                  {deleteModalConfig.type === "selected" && `Delete ${deleteModalConfig.messageIds.length} Messages?`}
                  {deleteModalConfig.type === "clear" && "Clear Chat History?"}
                  {deleteModalConfig.type === "clear_list" && "Delete Chat?"}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Confirm action
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {deleteModalConfig.type === "single" && (
                deleteModalConfig.isOwnMessage 
                  ? "Would you like to delete this message for yourself only, or delete it for everyone in the conversation?"
                  : "Are you sure you want to delete this message? It will only be removed from your chat history. Other participants will still see it."
              )}
              {deleteModalConfig.type === "selected" && (
                deleteModalConfig.isOwnMessage
                  ? "Would you like to delete these messages for yourself only, or delete them for everyone?"
                  : "Are you sure you want to delete these messages? They will only be removed from your chat history. Other participants will still see them."
              )}
              {deleteModalConfig.type === "clear" && (
                "Are you sure you want to clear your chat history? Other participants will still be able to see the messages."
              )}
              {deleteModalConfig.type === "clear_list" && (
                "Are you sure you want to delete this conversation and its history? This will remove the chat from your list. Other participants will still be able to see the messages."
              )}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {deleteModalConfig.type === "single" ? (
                deleteModalConfig.isOwnMessage ? (
                  <>
                    <button
                      onClick={() => confirmDeleteAction("everyone")}
                      className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                    >
                      Delete for Everyone
                    </button>
                    <button
                      onClick={() => confirmDeleteAction("me")}
                      className="w-full h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Delete for Me
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => confirmDeleteAction("me")}
                    className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                  >
                    Delete for Me
                  </button>
                )
              ) : deleteModalConfig.type === "selected" ? (
                deleteModalConfig.isOwnMessage ? (
                  <>
                    <button
                      onClick={() => confirmDeleteAction("everyone")}
                      className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                    >
                      Delete for Everyone
                    </button>
                    <button
                      onClick={() => confirmDeleteAction("me")}
                      className="w-full h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Delete for Me
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => confirmDeleteAction("me")}
                    className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                  >
                    Delete for Me
                  </button>
                )
              ) : deleteModalConfig.type === "clear_list" ? (
                <button
                  onClick={() => confirmDeleteAction("me")}
                  className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                >
                  Delete Chat
                </button>
              ) : (
                <button
                  onClick={() => confirmDeleteAction("me")}
                  className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                >
                  Clear Chat
                </button>
              )}
              
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="w-full h-9 rounded-xl border border-transparent text-slate-500 hover:text-slate-750 text-xs font-bold transition-all cursor-pointer mt-1 hover:bg-slate-50 active:scale-98"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Document Preview Modal Overlay */}
      {previewAttachment && (
        <div 
          className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setPreviewAttachment(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 text-left">
              <span className="text-xs font-bold text-slate-800 truncate pr-6 select-none">{previewAttachment.name}</span>
              <button 
                type="button" 
                className="text-slate-500 hover:text-slate-800 cursor-pointer border-none bg-transparent p-1.5 text-base font-bold font-sans"
                onClick={() => setPreviewAttachment(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4 min-h-[300px]">
              {previewAttachment.type === "image" ? (
                <img 
                  src={previewAttachment.url} 
                  alt={previewAttachment.name} 
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              ) : previewAttachment.url.startsWith("data:application/pdf;") ? (
                <iframe 
                  src={previewAttachment.url} 
                  title={previewAttachment.name} 
                  className="w-full h-[75vh] border-none rounded-lg"
                />
              ) : (
                <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-sm">
                  <Paperclip className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Preview Not Available</h4>
                  <p className="text-[10px] text-slate-500 mb-4 leading-normal">
                    This file format cannot be rendered directly. You can download the file to view its contents.
                  </p>
                  <a 
                    href={previewAttachment.url} 
                    download={previewAttachment.name}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors no-underline"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-205 shadow-xl flex flex-col overflow-hidden text-left">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Create New Group
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName("");
                  setSelectedGroupMembers([]);
                  setGroupSearchQuery("");
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-4 flex flex-col overflow-hidden max-h-[75vh]">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Sync / Client Onboarding"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-250 rounded-xl bg-slate-550/20 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="flex flex-col flex-1 overflow-hidden min-h-[200px]">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">
                  Select Group Members
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search team members / clients..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-[11px] border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:bg-white font-medium text-slate-800"
                  />
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1.5 bg-slate-50/30">
                  {availableUsers
                    .filter(u => 
                      u.fullName.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                      u.role.toLowerCase().includes(groupSearchQuery.toLowerCase())
                    )
                    .map((user) => {
                      const isChecked = selectedGroupMembers.includes(user.id);
                      return (
                        <label
                          key={`member-option-${user.id}`}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${
                            isChecked ? "bg-indigo-50/50 border border-indigo-100/50" : "border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedGroupMembers(prev => prev.filter(id => id !== user.id));
                              } else {
                                setSelectedGroupMembers(prev => [...prev, user.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Avatar name={user.fullName} src={user.avatar} size="xs" />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                            <p className="text-[10px] text-slate-450 truncate uppercase font-semibold">{user.role}</p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    setNewGroupName("");
                    setSelectedGroupMembers([]);
                    setGroupSearchQuery("");
                  }}
                  className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-550/20 text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Info Modal (Replaced right drawer with centered modal) */}
      {showGroupInfoDrawer && activeConvo && activeConvo.type === "GROUP" && (
        <div 
          onClick={() => setShowGroupInfoDrawer(false)}
          className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-205 shadow-xl flex flex-col overflow-hidden text-left max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Group Details
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupInfoDrawer(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Group Identification Card */}
              <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-indigo-600 shadow-sm mb-3">
                  {activeConvo.name ? activeConvo.name.substring(0, 2).toUpperCase() : "GP"}
                </div>
                <h4 className="text-sm font-bold text-slate-800">{activeConvo.name}</h4>
                <p className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-full mt-2 font-extrabold uppercase tracking-wide">
                  {activeConvo.participants?.length || 0} members
                </p>
              </div>

              {/* Members Listing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Group Members
                  </span>
                  {/* Show Add Members button if current user is admin/creator of group or admin role */}
                  {(activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN") && (
                    <button
                      type="button"
                      onClick={() => setShowAddMembersModal(true)}
                      className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-750 uppercase cursor-pointer border-none bg-transparent flex items-center gap-0.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Members
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[30vh] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/30">
                  {activeConvo.participants?.map((member) => {
                    const isCreator = activeConvo.creatorId === member.id;
                    const isAdmin = activeConvo.adminIds?.includes(member.id);
                    const isSelf = member.id === currentUser.id;
                    const isUserAdmin = activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN";

                    return (
                      <div 
                        key={`group-member-${member.id}`}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={member.fullName} src={member.avatar} size="xs" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {member.fullName} {isSelf && "(You)"}
                              </span>
                              {isCreator ? (
                                <span className="text-[8px] px-1 font-bold text-amber-700 bg-amber-50 rounded uppercase tracking-wide">Creator</span>
                              ) : isAdmin ? (
                                <span className="text-[8px] px-1 font-bold text-indigo-700 bg-indigo-50 rounded uppercase tracking-wide">Admin</span>
                              ) : null}
                            </div>
                            <p className="text-[9px] text-slate-450 uppercase font-semibold">{member.role}</p>
                          </div>
                        </div>

                        {/* Action options */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isUserAdmin && !isCreator && !isAdmin && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleMakeGroupAdmin(member.id)}
                              className="text-[10px] font-extrabold uppercase text-indigo-600 hover:text-indigo-700 cursor-pointer border-none bg-transparent hover:bg-indigo-50 px-2 py-1 rounded-lg shrink-0"
                            >
                              Make Admin
                            </button>
                          )}
                          {isUserAdmin && !isCreator && isAdmin && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDemoteGroupAdmin(member.id)}
                              className="text-[10px] font-extrabold uppercase text-amber-600 hover:text-amber-700 cursor-pointer border-none bg-transparent hover:bg-amber-50 px-2 py-1 rounded-lg shrink-0"
                            >
                              Demote
                            </button>
                          )}
                          {isUserAdmin && !isCreator && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-[10px] font-extrabold uppercase text-rose-550 hover:text-rose-600 cursor-pointer border-none bg-transparent hover:bg-rose-50 px-2 py-1 rounded-lg shrink-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  className="flex-1 h-9 rounded-xl bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/50 bg-white"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Group
                </button>
                {/* Delete button only for group admins */}
                {(activeConvo.creatorId === currentUser.id || activeConvo.adminIds?.includes(currentUser.id) || currentUser.role === "ADMIN") && (
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members to Group Modal */}
      {showAddMembersModal && activeConvo && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-205 shadow-xl flex flex-col overflow-hidden text-left">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Add Members to Group
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddMembersModal(false);
                  setNewMembersToAdd([]);
                  setAddMembersSearchQuery("");
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMembers} className="p-4 space-y-4 flex flex-col overflow-hidden max-h-[70vh]">
              <div className="flex flex-col flex-1 overflow-hidden min-h-[200px]">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    value={addMembersSearchQuery}
                    onChange={(e) => setAddMembersSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-[11px] border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:bg-white font-medium text-slate-800"
                  />
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1.5 bg-slate-50/30">
                  {availableUsers
                    .filter(u => !activeConvo.participants?.some(p => p.id === u.id))
                    .filter(u => 
                      u.fullName.toLowerCase().includes(addMembersSearchQuery.toLowerCase()) ||
                      u.role.toLowerCase().includes(addMembersSearchQuery.toLowerCase())
                    )
                    .map((user) => {
                      const isChecked = newMembersToAdd.includes(user.id);
                      return (
                        <label
                          key={`add-member-option-${user.id}`}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${
                            isChecked ? "bg-indigo-50/50 border border-indigo-100/50" : "border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewMembersToAdd(prev => prev.filter(id => id !== user.id));
                              } else {
                                setNewMembersToAdd(prev => [...prev, user.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Avatar name={user.fullName} src={user.avatar} size="xs" />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                            <p className="text-[10px] text-slate-450 truncate uppercase font-semibold">{user.role}</p>
                          </div>
                        </label>
                      );
                    })}
                  {availableUsers.filter(u => !activeConvo.participants?.some(p => p.id === u.id)).length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">All available users are already in the group.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setNewMembersToAdd([]);
                    setAddMembersSearchQuery("");
                  }}
                  className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50/50 text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newMembersToAdd.length === 0}
                  className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
                >
                  Add Selected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Confirmation Popup Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in animate-duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-205 shadow-2xl p-5 text-center flex flex-col items-center">
            {/* Warning or Info Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              confirmModalConfig.isDanger ? "bg-rose-50" : "bg-indigo-50"
            }`}>
              <Info className={`w-6 h-6 ${
                confirmModalConfig.isDanger ? "text-rose-600" : "text-indigo-600"
              }`} />
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">
              {confirmModalConfig.title}
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-5 px-1">
              {confirmModalConfig.message}
            </p>
            
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer bg-white"
              >
                {confirmModalConfig.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmModalConfig.onConfirm}
                className={`flex-1 h-9 rounded-xl text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs ${
                  confirmModalConfig.isDanger 
                    ? "bg-rose-600 hover:bg-rose-700" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {confirmModalConfig.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Chat Options Dropdown */}
      {dropdownConvo && (
        <>
          {/* Transparent click-away layer */}
          <div 
            className="fixed inset-0 z-[95] bg-transparent"
            onClick={() => setDropdownConvo(null)}
          />
          <div 
            style={{ 
              position: "fixed", 
              top: `${dropdownPos.top}px`, 
              left: `${dropdownPos.left}px`,
              width: "128px"
            }}
            className="archive-options-dropdown-container bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-[100] text-left font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin / Unpin option */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const convoId = dropdownConvo.id;
                const isPinned = dropdownConvo.pinnedByIds?.includes(currentUser.id);
                setDropdownConvo(null);
                if (isPinned) {
                  await handleUnpinConversation(convoId);
                } else {
                  await handlePinConversation(convoId);
                }
              }}
              className="w-full px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2 border-none bg-transparent"
            >
              <Pin className="w-3.5 h-3.5 text-slate-450 transform -rotate-45" />
              {dropdownConvo.pinnedByIds?.includes(currentUser.id) ? "Unpin Chat" : "Pin Chat"}
            </button>

            {/* Archive / Unarchive option */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const convoId = dropdownConvo.id;
                const isArchived = dropdownConvo.archivedByIds?.includes(currentUser.id);
                setDropdownConvo(null);
                if (isArchived) {
                  await handleUnarchiveConversation(convoId);
                } else {
                  await handleArchiveConversation(convoId);
                }
              }}
              className="w-full px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2 border-none bg-transparent"
            >
              <Archive className="w-3.5 h-3.5 text-slate-450" />
              {dropdownConvo.archivedByIds?.includes(currentUser.id) ? "Unarchive" : "Archive"}
            </button>

            {/* Delete option */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const convoId = dropdownConvo.id;
                setDropdownConvo(null);
                handleDeleteConversationClick(e, convoId);
              }}
              className="w-full px-3 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-2 border-none bg-transparent"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-450" />
              Delete
            </button>
          </div>
        </>
      )}

    </div>
  );
}
