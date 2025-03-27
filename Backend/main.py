from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
# from sklearn.feature_extraction.text import TfidfVectorizer
# import pandas as pd
from collections import Counter
import math
import re

app = FastAPI()

# Разрешаем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_text(text: str) -> str:
    # Приводим к нижнему регистру и убираем пунктуацию
    return re.sub(r"[^\w\s]", "", text.lower())
  
  
@app.post("/upload/")
async def upload_files(limit: int = 50, files: List[UploadFile] = File(...)):
  
    """ 
    Вычисления tf-idf c помощью нескольких файлов
    """
    
    texts = []
    all_words = []
    
    for file in files:
        content = await file.read()
        text = content.decode("utf-8")
        cleaned_text = clean_text(text)
        texts.append(cleaned_text)
        all_words += text.lower().split()
        
    """ 
    Код с использованием pandas and scikit-learn.
    в scikit-learn idf вычисляется с помощью ln() но в классической idf используется log10 
    """
    
    # vectorizer = TfidfVectorizer()
    # tfidf_matrix = vectorizer.fit_transform(texts)

    # words = vectorizer.get_feature_names_out()
    # tf_values = tfidf_matrix.sum(axis=0).A1
    # idf_values = vectorizer.idf_
    # df = pd.DataFrame({
    #     "word": words,
    #     "tf": tf_values,
    #     "idf": idf_values
    # })
    # df_sorted = df.sort_values(by="idf", ascending=False).head(limit)
    
    
    # Без сторонних библиотек
    N = len(files)
    tf_total = Counter()
    df_counter = Counter()
    for text in texts:
      words = text.lower().split()
      tf_total.update(words)
      unique_words = set(words)
      df_counter.update(unique_words)
      
    top_words = [word for word, _ in tf_total.most_common(limit)]
    idf = {}
    for word in top_words:
      df = df_counter[word]
      idf[word] = math.log(N/df) if df > 0 else 0.0
      
    total_terms = sum(len(text.lower().split()) for text in texts)
    data = []

    for word in top_words:
      tf = tf_total[word] / total_terms
      idf_val = idf[word]
      tfidf = tf * idf_val
      data.append({
        'word': word,
        'tf': tf,
        'df': df_counter[word],
        'idf': round(idf_val, 4),
        'tfidf': round(tfidf, 4)
      })
      
    
    # summary 
    total_words = len(all_words)
    unique_words = len(set(all_words))
    most_common = Counter(all_words).most_common(1)[0]

    summary = {
        "total_words": total_words,
        "unique_words": unique_words,
        "most_common_word": {
            "word": most_common[0],
            "count": most_common[1]
        }
    }
    return {
        "summary": summary,
        "data": sorted(data, key=lambda x: x['idf'], reverse=True)
        # "data": df_sorted.to_dict(orient="records")
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)