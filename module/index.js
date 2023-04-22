/*
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
*/

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;
var meal_Arr = [];
var calendar_Arr = [];
const Arr_a = [];

function openPopup() {
	document.getElementById("popup").style.display = "block";
	document.getElementById("overlay").style.display = "block";
}
function closePopup() {
	document.getElementById("popup").style.display = "none";
	document.getElementById("overlay").style.display = "none";
}
function formatTextWithLineBreaks(text) {
	if(text.includes('\n')) {
		return text.split('\n').join('<br>');
	} else {
		return text;
	}
}

document.addEventListener('DOMContentLoaded', function() {
	var calendarEl = document.getElementById('calendar');
	var calendar = new FullCalendar.Calendar(calendarEl, {
		initialDate: formattedDate,
		editable: false,
		selectable: true,
		businessHours: true,
		dayMaxEvents: true,
		events: [],
		/*
		headerToolbar: {
			left: 'title',
			center: '',
			right: 'today prev next'
		},
		*/
		eventClick: async function(info) {
			const calendar = info.view.calendar;
			const currentYear = String(calendar.currentData.currentDate.getFullYear()); // 현재 보여지는 년 정보
			const currentMonth = String(calendar.currentData.currentDate.getMonth()+1).padStart(2, '0'); // 현재 보여지는 달의 월 정보
			const clickedDate = String(info.event.startStr);
			const dateArray = clickedDate.split('-');
			const year_e = dateArray[0];
			const month_e = dateArray[1];
			const day_e = dateArray[2];
			const dtimeForm = `${year_e}-${month_e}`
			if (info.event.title.includes("급식")) {
				var popupTitle = info.event.title;
				for(var i = 0; i < meal_Arr.length; i++) {
					let year_d = meal_Arr[i]["year"]
					let month_d = meal_Arr[i]["month"].padStart(2, '0')
					let dtime = `${year_d}-${month_d}`
					if(dtime == dtimeForm) {
						var popupText = await meal_Arr[i][Number(day_e)];
					}
				}
			} else if(info.event.title.includes("학사일정")) {
				var popupTitle = info.event.title;
				for(var i = 0; i < calendar_Arr.length; i++) {
					let year_d = calendar_Arr[i]["year"]
					let month_d = calendar_Arr[i]["month"].padStart(2, '0')
					let dtime = `${year_d}-${month_d}`
					if(dtime == dtimeForm) {
						var popupText = await calendar_Arr[i][Number(day_e)];
					}
				}
			}
			var popupEl = document.getElementById("popup");
			popupEl.querySelector(".popup-title").textContent = popupTitle;
			popupEl.querySelector(".popup-text").innerHTML = formatTextWithLineBreaks(popupText);
			openPopup();
		},
		datesSet: async function(info) {
			var year_a = info.view.currentStart.getFullYear();
			var month_a = String(info.view.currentStart.getMonth() + 1).padStart(2, '0');
			
			// 이전 달 데이터 가져오기
			const prevMonth = new Date(info.view.currentStart.getFullYear(), info.view.currentStart.getMonth() - 1, 1);
			const prevYear = prevMonth.getFullYear();
			const prevMonthNum = String(prevMonth.getMonth() + 1).padStart(2, '0');
			
			// 다음 달 데이터 가져오기
			const nextMonth = new Date(info.view.currentStart.getFullYear(), info.view.currentStart.getMonth() + 1, 1);
			const nextYear = nextMonth.getFullYear();
			const nextMonthNum = String(nextMonth.getMonth() + 1).padStart(2, '0');
			
			showLoading();
			try {
				await fetchData(prevYear, prevMonthNum);
				await fetchData(year_a, month_a);
				await fetchData(nextYear, nextMonthNum);
			} catch(err) {
				handleError();
			} finally {
				hideLoading();
			}

			async function fetchData(year_a, month_a) {
				const key = `${year_a}-${month_a}`;
				if (!Arr_a.includes(key)) {
					await fetchNewData(year_a, month_a);
					Arr_a.push(`${year_a}-${month_a}`);
				}/* else {
					await fetchCachedData(year_a, month_a);
				}
				*/
			}
			
			async function responseF(year_a, month_a) {
				try {
					const response = await fetch('/Calendar-info', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ year_a, month_a }),
					});
					const data = await response.json();
					return data;
				} catch(err) {
					handleError();
				}
			}
			
			async function fetchNewData(year_a, month_a) {
				try {
					const data = await responseF(year_a, month_a)
					const meal_s = await data.meal;
					const calendar_s = await data.calendar;
					
					meal_Arr.push(meal_s)
					calendar_Arr.push(calendar_s)
					
					addEventsToCalendar(meal_s, calendar_s, year_a, month_a);
				} catch(err) {
					handleError();
				}
			}
			/*
			async function fetchCachedData(year_a, month_a) {
				try {
					const data = await responseF(year_a, month_a)
					const meal_s = data.meal;
					const calendar_s = data.calendar;
					
					meal_Arr.push(meal_s)
					calendar_Arr.push(calendar_s)

				} catch(err) {
					handleError();
				}
			}
			*/
			async function addEventsToCalendar(meal_s, calendar_s, year_a, month_a) {
				try {
					for (let i = 1; i < Object.keys(meal_s).length - 3; i++) {
						const day_a = i;
						const day_b = (day_a < 10) ? `0${day_a}` : `${day_a}`
						const dateNstr = `${year_a}-${month_a}-${day_b}`
						if (Object.values(meal_s[String(i)]).length !== 0) {
							const mealEvent = {
								title: `[ ${dateNstr} 급식 ]`,
								start: dateNstr,
								allDay: true,
								color: 'blue'
							};
							await calendar.addEvent(mealEvent);
						}
						if (Object.values(calendar_s[String(i)]).length !== 0) {
							const calendarEvent = {
								title: `[ ${dateNstr} 학사일정 ]`,
								start: dateNstr,
								allDay: true,
								color: 'rad'
							};
							await calendar.addEvent(calendarEvent);
						}
					}
				} catch(err) {
					handleError();
				}
			}
			function handleError() {
				hideLoading();
				console.error(err);
				alert('데이터를 가져오는 중 에러가 발생했습니다.');
			}
		},
	});
	calendar.render();
	
	function showLoading() {
		const loadingEl = document.getElementById('loading');
		loadingEl.style.display = 'block';
	}
	function hideLoading() {
		const loadingEl = document.getElementById('loading');
		loadingEl.style.display = 'none';
	}
	
	const nextBtn = document.querySelector('.fc-next-button');
	const prevBtn = document.querySelector('.fc-prev-button');
	
	let isCoolingDown = false;
	
	function disableButtons(callback) {
		isCoolingDown = true;
		nextBtn.disabled = true;
		prevBtn.disabled = true;
		
		setTimeout(() => {
			hideLoading();
			isCoolingDown = false;
			nextBtn.disabled = false;
			prevBtn.disabled = false;
			
			if (callback) {
				callback();
			}
		}, 500);
	}
	
	nextBtn.addEventListener('click', function() {
		if (!isCoolingDown) {
			showLoading();
			disableButtons();
		}
	});
	
	prevBtn.addEventListener('click', function() {
		if (!isCoolingDown) {
			showLoading();
			disableButtons();
		}
	});
});