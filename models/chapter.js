"use strict";

const constants = require('../helpers/constants');
const { ObjectId } = require('mongodb');
const { mongoose } = constants;
const { Schema } = mongoose;

const chapterSchema = new Schema({
    storyId: {
        type: ObjectId,
        required: ["Needs the 1st chapter in this story"],
    },
    authorName: {
        type: String,
        required: ["Author is needed"],
    },
    chapterTitle: {
        type: String,
        default: null,
    },
    storyTitle: {
        type: String,
        required: ['Story Title is needed'],
    },
    bodyText: {
        type: String,
        required: ['The body is needed'],
    },
    previousChapter: {
        type: ObjectId,
        default: null,
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
    keywords: {
        type: [String],
        default: [],
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

chapterSchema.virtual('authorId', {
    ref: 'User',
    localField: 'authorName',
    foreignField: 'userName',
    justOne: true,
});

chapterSchema.virtual('continuationChapters', {
    ref: 'Chapter',
    localField: '_id',
    foreignField: 'previousChapter',
});

chapterSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'chapter',
    count: true,
});

chapterSchema.methods.setLikedByUser = async function setLikedByUser(userId) {
    if (userId) {
        const result = await mongoose.model('Like').findOne({ user: userId, chapter: this._id });
        this.likedByUser = !!result;
    }
}

chapterSchema.methods.setBookmarkedByUser = async function setBookmarkedByUser(userId) {
    if (userId) {
        const result = await mongoose.model('Bookmark').findOne({ user: userId, chapter: this._id });
        this.bookmarkedByUser = !!result;
    }
}

chapterSchema.statics.findByIdAndPopulate = async function findByIdAndPopulate(id, userId) {
    const result = await Chapter.findById(id)
        .populate('likes')
        .populate({
            path: 'authorId',
            transform: auth => auth._id,
        })
        .populate({
            path: 'continuationChapters',
            transform: chapter => chapter.summary(),
            populate: 'likes'
        });
    if (result) {
        await result.setLikedByUser(userId);
        await result.setBookmarkedByUser(userId);
    }
    return result;
}

chapterSchema.statics.findAndPopulate = async function findAndPopulate(chapterQuery, sortQuery, skip, limit, userId) {
    const aggregate = await Chapter.aggregate([
        { $match: chapterQuery },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "chapter",
                as: "likes"
            }
        },
        { $set: { likes: { $size: "$likes" } } },
        { $sort: sortQuery },
        { $skip: skip },
        { $limit: limit },
    ], { collation: { locale: 'en' } });
    const result = await Promise.all(
        aggregate.map((chapter) => {
            return Chapter.findById(chapter._id)
                .populate('likes')
                .populate({
                    path: 'authorId',
                    transform: auth => auth._id,
                });
        })
    );

    await Promise.all(result.map(chapter => chapter.setLikedByUser(userId)));
    await Promise.all(result.map(chapter => chapter.setBookmarkedByUser(userId)));
    return result;
}

chapterSchema.methods.saveNewStory = async function saveNewStory() {
    this.storyId = this._id;
    await this.save();
    await this.populate('likes');
    await this.populate({
        path: 'authorId',
        transform: auth => auth._id,
    });
}

chapterSchema.methods.saveContinuationChapter = async function saveContinuationChapter(prevChapter) {
    this.storyId = prevChapter.storyId;
    this.storyTitle = prevChapter.storyTitle;
    await this.save();
    await this.populate('likes');
    await this.populate({
        path: 'authorId',
        transform: auth => auth._id,
    });
}

chapterSchema.methods.summary = function summary() {
    const result = {};
    for (const key of constants.summaryKeys) {
        result[key] = this[key];
    }
    result.chapterId = this._id;
    return result;
}

chapterSchema.methods.fullInfo = async function fullInfo() {
    return {
        storyId: this.storyId,
        chapterId: this._id,
        storyTitle: this.storyTitle,
        chapterTitle: this.chapterTitle,
        authorName: this.authorName,
        authorId: this.authorId,
        bodyText: this.bodyText,
        previousChapter: this.previousChapter,
        createDate: this.createDate,
        keywords: this.keywords,
        likes: this.likes,
        likedByUser: this.likedByUser,
        bookmarkedByUser: this.bookmarkedByUser,
    };
}

chapterSchema.methods.fullInfoWithContinuations = async function fullInfoWithContinuations() {
    return {
        storyId: this.storyId,
        chapterId: this._id,
        authorName: this.authorName,
        authorId: this.authorId,
        chapterTitle: this.chapterTitle,
        storyTitle: this.storyTitle,
        bodyText: this.bodyText,
        previousChapter: this.previousChapter,
        createDate: this.createDate,
        keywords: this.keywords,
        likes: this.likes,
        likedByUser: this.likedByUser,
        bookmarkedByUser: this.bookmarkedByUser,
        continuationChapters: this.continuationChapters,
    };
}

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;