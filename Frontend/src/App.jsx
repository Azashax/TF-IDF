import { useState } from 'react'
import axios from 'axios'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import './App.css'

function App() {
	const [files, setFiles] = useState([])
	const [data, setData] = useState([])
	const [params, setParams] = useState({ limit: 50, words: 50, page: 0 })
	const [sortBy, setSortBy] = useState('idf')

	const handleUpload = async e => {
		e.preventDefault()
		if (!files.length | !params.limit) return

		const formData = new FormData()
		files.forEach(file => {
			formData.append('files', file)
		})

		const res = await axios.post(
			`http://localhost:8000/upload/?limit=${params.limit}`,
			formData
		)
		setData(res.data)
		setParams(prev => ({
			...prev,
			page: 0,
		}))
	}

	const downloadExcel = () => {
		if (!data.data?.length) return

		const worksheet = XLSX.utils.json_to_sheet(
			data.data.map(row => ({
				Слово: row.word,
				TF: row.tf.toFixed(2),
				IDF: row.idf.toFixed(2),
			}))
		)

		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'TF-IDF')

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array',
		})
		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		})
		saveAs(blob, 'tfidf_results.xlsx')
	}

	const sortedData =
		data.data &&
		[...data.data].sort((a, b) =>
			sortBy === 'idf' ? b.idf - a.idf : b.tf - a.tf
		)
	const startIndex = params.page * params.words
	const endIndex = startIndex + params.words
	const visibleWords = sortedData?.slice(startIndex, endIndex)

	return (
		<div className='container'>
			<h1>TF-IDF Анализатор</h1>
			<form onSubmit={handleUpload}>
				<div>
					<input
						type='file'
						accept='.txt'
						multiple
						onChange={e => setFiles(Array.from(e.target.files))}
					/>
					<label>
						Лимит слов:
						<input
							type='number'
							value={params.limit}
							onChange={e =>
								setParams(prev => ({
									...prev,
									limit: parseInt(e.target.value),
								}))
							}
							min='10'
							style={{ marginLeft: '8px', width: '60px' }}
						/>
					</label>
					<button type='submit'>Загрузить</button>
				</div>
				{files.length > 0 && (
					<div style={{ fontSize: '11px' }}>
						{files.map((file, index) => (
							<p key={index}>{file.name}</p>
						))}
					</div>
				)}
			</form>

			{data.data?.length > 0 && (
				<>
					<button onClick={downloadExcel} style={{ marginBottom: '10px' }}>
						Экспорт в Excel
					</button>

					<table>
						<thead>
							<tr>
								<th>Общее число слов</th>
								<th>Уникальных слов</th>
								<th>Самое Частое слово</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{data.summary['total_words']}</td>
								<td>{data.summary['unique_words']}</td>
								<td>
									{data.summary.most_common_word?.['word']} (
									{data.summary.most_common_word?.['count']})
								</td>
							</tr>
						</tbody>
					</table>
					<br></br>
					<select onChange={e => setSortBy(e.target.value)} value={sortBy}>
						<option value='idf'>Сортировать по IDF</option>
						<option value='tf'>Сортировать по TF</option>
					</select>
					<div style={{ margin: '20px 0' }}>
						<input
							type='number'
							value={params.words}
							onChange={e =>
								setParams(prev => ({
									...prev,
									words: parseInt(e.target.value),
								}))
							}
							min='10'
							style={{ marginLeft: '8px', width: '60px' }}
						/>
						<button
							onClick={() =>
								setParams(p => ({
									...p,
									page: Math.max(0, p.page - 1),
								}))
							}
							disabled={params.page === 0}
						>
							← Назад
						</button>

						<span style={{ margin: '0 10px' }}>cтр. {params.page + 1}</span>

						<button
							onClick={() =>
								setParams(p => ({
									...p,
									page: p.page + 1,
								}))
							}
							disabled={(params.page + 1) * params.words >= data.data.length}
						>
							Далее →
						</button>
					</div>

					<table>
						<thead>
							<tr>
								<th>№</th>
								<th>Слово</th>
								<th>TF</th>
								<th>DF</th>
								<th>IDF</th>
								<th>TF-IDF</th>
							</tr>
						</thead>
						<tbody>
							{visibleWords.map((word, i) => (
								<tr key={i}>
									<td>{params.page + i + 1}</td>
									<td>{word.word}</td>
									<td>{word.tf.toFixed(4)}</td>
									<td>{word.df}</td>
									<td>{word.idf}</td>
									<td>{word.tfidf}</td>
								</tr>
							))}
						</tbody>
					</table>
					<div style={{ marginTop: '20px' }}>
						<input
							type='number'
							value={params.words}
							onChange={e =>
								setParams(prev => ({
									...prev,
									words: parseInt(e.target.value),
								}))
							}
							min='10'
							style={{ marginLeft: '8px', width: '60px' }}
						/>
						<button
							onClick={() =>
								setParams(p => ({
									...p,
									page: Math.max(0, p.page - 1),
								}))
							}
							disabled={params.page === 0}
						>
							← Назад
						</button>

						<span style={{ margin: '0 10px' }}>cтр. {params.page + 1}</span>

						<button
							onClick={() =>
								setParams(p => ({
									...p,
									page: p.page + 1,
								}))
							}
							disabled={(params.page + 1) * params.words >= data.data.length}
						>
							Далее →
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export default App
