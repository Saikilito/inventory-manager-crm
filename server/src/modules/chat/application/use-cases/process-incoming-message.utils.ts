import { z } from "zod";

export const potentialCedulaRegex =
  /\b(?:[vVeE]-?)?\d{1,3}(?:\.\d{3}){2}\b|\b(?:[vVeE]-?)?\d{7,9}\b/;

export const splitMessageIntoChunks = (text: string, targetWordCount = 50): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= targetWordCount * 1.5) {
    return [text];
  }

  const paragraphs = text.split(/\n+/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).filter(Boolean).length;

    if (currentWordCount + paragraphWords > targetWordCount && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [paragraph];
      currentWordCount = paragraphWords;
    } else {
      currentChunk.push(paragraph);
      currentWordCount += paragraphWords;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    const chunkWords = chunk.split(/\s+/).filter(Boolean).length;
    if (chunkWords <= targetWordCount * 1.5) {
      finalChunks.push(chunk);
    } else {
      const sentences = chunk.match(/[^.!?]+[.!?]+(\s+|$)/g) || [chunk];
      let sentenceChunk: string[] = [];
      let sentenceWordCount = 0;

      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
        if (sentenceWordCount + sentenceWords > targetWordCount && sentenceChunk.length > 0) {
          finalChunks.push(sentenceChunk.join("").trim());
          sentenceChunk = [sentence];
          sentenceWordCount = sentenceWords;
        } else {
          sentenceChunk.push(sentence);
          sentenceWordCount += sentenceWords;
        }
      }
      if (sentenceChunk.length > 0) {
        finalChunks.push(sentenceChunk.join("").trim());
      }
    }
  }

  return finalChunks.filter(Boolean);
};

export const getCaracasDateStr = (date: Date = new Date()): string => {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
};
