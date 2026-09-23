import db from "../db";
import Comment from "./comment";
import Concern from "./concern";
import Event from "./event";
import Frosh from "./frosh";
import FlashcardStar from "./flashcardStar";
import Prediction from "./prediction";
import QuizAttempt from "./quizAttempt";
import SiteConfig from "./siteConfig";
import UserPreference from "./userPreference";
import Vote from "./vote";

// Comments are made on frosh profiles
Frosh.hasMany(Comment, { foreignKey: "froshId" });
Comment.belongsTo(Frosh);

// Users predict where frosh will go
Frosh.hasMany(Prediction);
Prediction.belongsTo(Frosh);

// Frosh go to events
Event.belongsToMany(Frosh, { through: "frotator-frosh-events" });
Frosh.belongsToMany(Event, { through: "frotator-frosh-events" });

// Votes on frosh
Frosh.hasMany(Vote);
Vote.belongsTo(Frosh);

// Private practice markers for flashcards
FlashcardStar.belongsTo(Frosh, { foreignKey: "froshId", onDelete: "CASCADE" });

// Concerns about frosh
Frosh.hasMany(Concern);
Concern.belongsTo(Frosh);

// Comments can have replies (self-referential)
Comment.hasMany(Comment);
Comment.belongsTo(Comment, { foreignKey: "replyToId" });

// Sync tables on first import
db.sync().catch(console.error);

export { db, Comment, Concern, Event, Frosh, FlashcardStar, Prediction, QuizAttempt, SiteConfig, UserPreference, Vote };
