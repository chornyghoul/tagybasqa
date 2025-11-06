// ========== Данные курсов для всех специальностей ==========

const coursesData = {
    'information-networks': {
        title: 'Информационные сети и системы связи',
        description: 'Освойте проектирование, настройку и администрирование современных сетевых инфраструктур',
        courses: [
            {
                id: 'networks-basics',
                badge: 'Начальный',
                title: 'Основы компьютерных сетей',
                description: 'Изучите базовые концепции сетевых технологий, модель OSI и протоколы передачи данных',
                lessons: 7,
                duration: '6 часов',
                lessons_data: [
                    {
                        title: 'Введение в компьютерные сети',
                        content: `
                            <h3>Что такое компьютерная сеть?</h3>
                            <p>Компьютерная сеть — это совокупность компьютеров и устройств, соединённых каналами связи для обмена информацией и совместного использования ресурсов.</p>

                            <h3>Основные типы сетей:</h3>
                            <ul>
                                <li><strong>LAN (Local Area Network)</strong> — локальная сеть в пределах одного здания или комплекса</li>
                                <li><strong>WAN (Wide Area Network)</strong> — глобальная сеть, соединяющая устройства на больших расстояниях</li>
                                <li><strong>MAN (Metropolitan Area Network)</strong> — городская сеть</li>
                            </ul>

                            <p>Сети позволяют пользователям обмениваться файлами, использовать общие принтеры и другие ресурсы, а также взаимодействовать через интернет.</p>
                        `,
                        question: 'Какой тип сети используется в пределах одного офиса или здания?',
                        answers: [
                            { text: 'WAN', correct: false },
                            { text: 'LAN', correct: true },
                            { text: 'MAN', correct: false },
                            { text: 'PAN', correct: false }
                        ]
                    },
                    {
                        title: 'Модель OSI',
                        content: `
                            <h3>Модель OSI (Open Systems Interconnection)</h3>
                            <p>Модель OSI — это концептуальная модель, описывающая семь уровней взаимодействия сетевых протоколов:</p>

                            <ul>
                                <li><strong>7. Прикладной</strong> — HTTP, FTP, SMTP</li>
                                <li><strong>6. Представительский</strong> — шифрование, сжатие данных</li>
                                <li><strong>5. Сеансовый</strong> — управление сеансами связи</li>
                                <li><strong>4. Транспортный</strong> — TCP, UDP</li>
                                <li><strong>3. Сетевой</strong> — IP-адресация, маршрутизация</li>
                                <li><strong>2. Канальный</strong> — MAC-адреса, коммутация</li>
                                <li><strong>1. Физический</strong> — электрические сигналы, кабели</li>
                            </ul>

                            <p>Каждый уровень выполняет определённые функции и взаимодействует только с соседними уровнями.</p>
                        `,
                        question: 'На каком уровне модели OSI работает протокол TCP?',
                        answers: [
                            { text: 'Прикладной', correct: false },
                            { text: 'Сетевой', correct: false },
                            { text: 'Транспортный', correct: true },
                            { text: 'Канальный', correct: false }
                        ]
                    },
                    {
                        title: 'IP-адресация',
                        content: `
                            <h3>IP-адрес</h3>
                            <p>IP-адрес (Internet Protocol address) — уникальный идентификатор устройства в сети. Существует две версии:</p>

                            <h3>IPv4</h3>
                            <p>Состоит из 4 октетов (32 бита): <code>192.168.1.1</code></p>
                            <p>Классы адресов: A (1.0.0.0 - 126.255.255.255), B (128.0.0.0 - 191.255.255.255), C (192.0.0.0 - 223.255.255.255)</p>

                            <h3>IPv6</h3>
                            <p>Состоит из 8 групп по 16 бит (128 бит): <code>2001:0db8:85a3:0000:0000:8a2e:0370:7334</code></p>

                            <p><strong>Маска подсети</strong> определяет, какая часть адреса относится к сети, а какая — к узлу.</p>
                        `,
                        question: 'Сколько бит содержится в IPv4-адресе?',
                        answers: [
                            { text: '16 бит', correct: false },
                            { text: '32 бита', correct: true },
                            { text: '64 бита', correct: false },
                            { text: '128 бит', correct: false }
                        ]
                    },
                    {
                        title: 'Протоколы TCP и UDP',
                        content: `
                            <h3>TCP (Transmission Control Protocol)</h3>
                            <p>Протокол с установлением соединения, гарантирует доставку данных в правильном порядке. Используется для:</p>
                            <ul>
                                <li>Веб-страниц (HTTP/HTTPS)</li>
                                <li>Электронной почты (SMTP, POP3)</li>
                                <li>Передачи файлов (FTP)</li>
                            </ul>

                            <h3>UDP (User Datagram Protocol)</h3>
                            <p>Протокол без установления соединения, не гарантирует доставку. Используется для:</p>
                            <ul>
                                <li>Видеотрансляций</li>
                                <li>Онлайн-игр</li>
                                <li>DNS-запросов</li>
                            </ul>

                            <p>TCP надёжнее, но медленнее. UDP быстрее, но менее надёжен.</p>
                        `,
                        question: 'Какой протокол гарантирует доставку данных?',
                        answers: [
                            { text: 'UDP', correct: false },
                            { text: 'TCP', correct: true },
                            { text: 'ICMP', correct: false },
                            { text: 'ARP', correct: false }
                        ]
                    },
                    {
                        title: 'DNS и доменные имена',
                        content: `
                            <h3>DNS (Domain Name System)</h3>
                            <p>DNS — это система преобразования доменных имён (example.com) в IP-адреса (93.184.216.34).</p>

                            <h3>Как работает DNS:</h3>
                            <ul>
                                <li>Пользователь вводит адрес сайта в браузере</li>
                                <li>Запрос отправляется DNS-серверу</li>
                                <li>DNS-сервер возвращает IP-адрес</li>
                                <li>Браузер подключается к серверу по IP-адресу</li>
                            </ul>

                            <h3>Типы DNS-записей:</h3>
                            <ul>
                                <li><strong>A</strong> — связь домена с IPv4-адресом</li>
                                <li><strong>AAAA</strong> — связь домена с IPv6-адресом</li>
                                <li><strong>CNAME</strong> — создание псевдонима домена</li>
                                <li><strong>MX</strong> — почтовый сервер домена</li>
                            </ul>
                        `,
                        question: 'Для чего используется DNS?',
                        answers: [
                            { text: 'Для шифрования данных', correct: false },
                            { text: 'Для преобразования доменных имён в IP-адреса', correct: true },
                            { text: 'Для маршрутизации пакетов', correct: false },
                            { text: 'Для защиты от вирусов', correct: false }
                        ]
                    },
                    {
                        title: 'Маршрутизация',
                        content: `
                            <h3>Что такое маршрутизация?</h3>
                            <p>Маршрутизация — процесс выбора пути передачи данных между сетями. Маршрутизаторы анализируют IP-адрес назначения и определяют оптимальный путь.</p>

                            <h3>Типы маршрутизации:</h3>
                            <ul>
                                <li><strong>Статическая</strong> — маршруты настраиваются вручную администратором</li>
                                <li><strong>Динамическая</strong> — маршруты определяются автоматически с помощью протоколов (RIP, OSPF, BGP)</li>
                            </ul>

                            <h3>Таблица маршрутизации:</h3>
                            <p>Содержит информацию о доступных путях: сеть назначения, маску подсети, шлюз и метрику (приоритет маршрута).</p>
                        `,
                        question: 'Какой тип маршрутизации настраивается вручную?',
                        answers: [
                            { text: 'Динамическая', correct: false },
                            { text: 'Статическая', correct: true },
                            { text: 'Автоматическая', correct: false },
                            { text: 'Адаптивная', correct: false }
                        ]
                    },
                    {
                        title: 'Сетевая безопасность',
                        content: `
                            <h3>Основы сетевой безопасности</h3>
                            <p>Защита сети включает несколько уровней обороны:</p>

                            <h3>Файрвол (Firewall)</h3>
                            <p>Контролирует входящий и исходящий трафик на основе правил безопасности. Может быть аппаратным или программным.</p>

                            <h3>VPN (Virtual Private Network)</h3>
                            <p>Создаёт защищённый туннель для передачи данных через публичные сети. Шифрует трафик и скрывает IP-адрес.</p>

                            <h3>Основные угрозы:</h3>
                            <ul>
                                <li><strong>DDoS-атаки</strong> — перегрузка сервера запросами</li>
                                <li><strong>Man-in-the-Middle</strong> — перехват трафика между клиентом и сервером</li>
                                <li><strong>Фишинг</strong> — кража учётных данных через поддельные сайты</li>
                            </ul>
                        `,
                        question: 'Что делает файрвол?',
                        answers: [
                            { text: 'Ускоряет интернет-соединение', correct: false },
                            { text: 'Контролирует сетевой трафик по правилам безопасности', correct: true },
                            { text: 'Преобразует доменные имена в IP-адреса', correct: false },
                            { text: 'Сжимает передаваемые данные', correct: false }
                        ]
                    }
                ]
            },
            {
                id: 'networks-routing',
                badge: 'Средний',
                title: 'Маршрутизация и коммутация',
                description: 'Углублённое изучение работы маршрутизаторов, коммутаторов и протоколов динамической маршрутизации',
                lessons: 6,
                duration: '8 часов'
            },
            {
                id: 'networks-wireless',
                badge: 'Средний',
                title: 'Беспроводные сети',
                description: 'Wi-Fi технологии, стандарты 802.11, настройка точек доступа и обеспечение безопасности',
                lessons: 5,
                duration: '5 часов'
            },
            {
                id: 'networks-admin',
                badge: 'Продвинутый',
                title: 'Администрирование сетей',
                description: 'Мониторинг, диагностика и устранение неполадок в корпоративных сетях',
                lessons: 8,
                duration: '10 часов'
            }
        ]
    },

    'information-security': {
        title: 'Информационная безопасность',
        description: 'Станьте специалистом по защите информации и кибербезопасности',
        courses: [
            {
                id: 'security-basics',
                badge: 'Начальный',
                title: 'Основы информационной безопасности',
                description: 'Введение в концепции ИБ, модель CIA, классификация угроз и основные методы защиты',
                lessons: 7,
                duration: '6 часов',
                lessons_data: [
                    {
                        title: 'Введение в информационную безопасность',
                        content: `
                            <h3>Что такое информационная безопасность?</h3>
                            <p>Информационная безопасность (ИБ) — это комплекс мер по защите информации от несанкционированного доступа, использования, раскрытия, искажения или уничтожения.</p>

                            <h3>Модель CIA (триада безопасности):</h3>
                            <ul>
                                <li><strong>Confidentiality (Конфиденциальность)</strong> — доступ к информации только для авторизованных лиц</li>
                                <li><strong>Integrity (Целостность)</strong> — защита данных от несанкционированного изменения</li>
                                <li><strong>Availability (Доступность)</strong> — обеспечение доступа к данным для авторизованных пользователей</li>
                            </ul>

                            <p>Эти три принципа составляют основу всех систем информационной безопасности.</p>
                        `,
                        question: 'Что входит в модель CIA?',
                        answers: [
                            { text: 'Конфиденциальность, Интерфейс, Аутентификация', correct: false },
                            { text: 'Конфиденциальность, Целостность, Доступность', correct: true },
                            { text: 'Криптография, Интеграция, Авторизация', correct: false },
                            { text: 'Контроль, Идентификация, Аудит', correct: false }
                        ]
                    },
                    {
                        title: 'Классификация угроз безопасности',
                        content: `
                            <h3>Типы угроз информационной безопасности</h3>

                            <h3>По источнику:</h3>
                            <ul>
                                <li><strong>Внутренние</strong> — от сотрудников компании (намеренные или случайные)</li>
                                <li><strong>Внешние</strong> — от хакеров, конкурентов, киберпреступников</li>
                            </ul>

                            <h3>По природе:</h3>
                            <ul>
                                <li><strong>Техногенные</strong> — отказ оборудования, сбои ПО</li>
                                <li><strong>Антропогенные</strong> — действия человека (ошибки, злой умысел)</li>
                                <li><strong>Стихийные</strong> — природные катастрофы</li>
                            </ul>

                            <h3>Основные виды атак:</h3>
                            <ul>
                                <li>Вредоносное ПО (вирусы, трояны, ransomware)</li>
                                <li>Фишинг и социальная инженерия</li>
                                <li>DDoS-атаки</li>
                                <li>SQL-инъекции</li>
                                <li>Брутфорс (подбор паролей)</li>
                            </ul>
                        `,
                        question: 'Какие угрозы исходят от сотрудников компании?',
                        answers: [
                            { text: 'Внешние', correct: false },
                            { text: 'Внутренние', correct: true },
                            { text: 'Стихийные', correct: false },
                            { text: 'Виртуальные', correct: false }
                        ]
                    },
                    {
                        title: 'Методы аутентификации',
                        content: `
                            <h3>Аутентификация vs Авторизация</h3>
                            <p><strong>Аутентификация</strong> — проверка подлинности пользователя ("кто вы?").</p>
                            <p><strong>Авторизация</strong> — предоставление прав доступа ("что вам разрешено делать?").</p>

                            <h3>Факторы аутентификации:</h3>
                            <ul>
                                <li><strong>Что вы знаете</strong> — пароль, PIN-код, секретный вопрос</li>
                                <li><strong>Что у вас есть</strong> — смартфон, токен, смарт-карта</li>
                                <li><strong>Кто вы есть</strong> — биометрия (отпечаток пальца, сканирование лица)</li>
                            </ul>

                            <h3>Многофакторная аутентификация (MFA)</h3>
                            <p>Использование двух или более факторов существенно повышает безопасность. Пример: пароль + SMS-код.</p>
                        `,
                        question: 'Что такое многофакторная аутентификация?',
                        answers: [
                            { text: 'Использование нескольких паролей', correct: false },
                            { text: 'Использование двух или более факторов для проверки личности', correct: true },
                            { text: 'Вход с нескольких устройств', correct: false },
                            { text: 'Несколько попыток ввода пароля', correct: false }
                        ]
                    },
                    {
                        title: 'Основы криптографии',
                        content: `
                            <h3>Что такое криптография?</h3>
                            <p>Криптография — наука о методах шифрования информации для обеспечения её конфиденциальности и целостности.</p>

                            <h3>Симметричное шифрование</h3>
                            <p>Используется один ключ для шифрования и расшифрования. Примеры: AES, DES, 3DES.</p>
                            <p><strong>Плюсы:</strong> высокая скорость. <strong>Минусы:</strong> сложность безопасной передачи ключа.</p>

                            <h3>Асимметричное шифрование</h3>
                            <p>Используется пара ключей: публичный (для шифрования) и приватный (для расшифрования). Примеры: RSA, ECC.</p>
                            <p><strong>Плюсы:</strong> безопасная передача ключа. <strong>Минусы:</strong> медленнее симметричного.</p>

                            <h3>Хеширование</h3>
                            <p>Преобразование данных в уникальную строку фиксированной длины. Используется для хранения паролей. Примеры: SHA-256, MD5.</p>
                        `,
                        question: 'Какое шифрование использует пару ключей?',
                        answers: [
                            { text: 'Симметричное', correct: false },
                            { text: 'Асимметричное', correct: true },
                            { text: 'Хеширование', correct: false },
                            { text: 'Кодирование', correct: false }
                        ]
                    },
                    {
                        title: 'Защита от вредоносного ПО',
                        content: `
                            <h3>Типы вредоносного ПО</h3>

                            <h3>Вирусы</h3>
                            <p>Самовоспроизводящиеся программы, заражающие файлы и программы.</p>

                            <h3>Трояны</h3>
                            <p>Маскируются под легитимное ПО, предоставляют злоумышленнику доступ к системе.</p>

                            <h3>Ransomware (шифровальщики)</h3>
                            <p>Шифруют файлы пользователя и требуют выкуп за расшифровку.</p>

                            <h3>Spyware</h3>
                            <p>Собирают информацию о действиях пользователя без его ведома.</p>

                            <h3>Методы защиты:</h3>
                            <ul>
                                <li>Установка антивирусного ПО и регулярное обновление</li>
                                <li>Обновление операционной системы и приложений</li>
                                <li>Осторожность при открытии вложений и ссылок</li>
                                <li>Использование файрвола</li>
                                <li>Регулярное резервное копирование данных</li>
                            </ul>
                        `,
                        question: 'Какое вредоносное ПО шифрует файлы и требует выкуп?',
                        answers: [
                            { text: 'Вирус', correct: false },
                            { text: 'Троян', correct: false },
                            { text: 'Ransomware', correct: true },
                            { text: 'Spyware', correct: false }
                        ]
                    },
                    {
                        title: 'Социальная инженерия',
                        content: `
                            <h3>Что такое социальная инженерия?</h3>
                            <p>Социальная инженерия — это манипулирование людьми с целью получения конфиденциальной информации или доступа к системам.</p>

                            <h3>Распространённые техники:</h3>

                            <h3>Фишинг</h3>
                            <p>Отправка поддельных писем от имени доверенных организаций для кражи паролей или данных карт.</p>

                            <h3>Претекстинг</h3>
                            <p>Создание вымышленного сценария для выманивания информации (например, звонок от "техподдержки").</p>

                            <h3>Baiting</h3>
                            <p>Приманка в виде заражённой флешки или скачиваемого файла.</p>

                            <h3>Как защититься:</h3>
                            <ul>
                                <li>Проверять адреса отправителей писем</li>
                                <li>Не раскрывать конфиденциальную информацию по телефону или email</li>
                                <li>Использовать двухфакторную аутентификацию</li>
                                <li>Проходить обучение по безопасности</li>
                            </ul>
                        `,
                        question: 'Что такое фишинг?',
                        answers: [
                            { text: 'Вирус, удаляющий файлы', correct: false },
                            { text: 'Отправка поддельных писем для кражи данных', correct: true },
                            { text: 'Взлом сетевого оборудования', correct: false },
                            { text: 'Перехват сетевого трафика', correct: false }
                        ]
                    },
                    {
                        title: 'Политики безопасности',
                        content: `
                            <h3>Политика информационной безопасности</h3>
                            <p>Документ, определяющий правила и процедуры защиты информации в организации.</p>

                            <h3>Основные компоненты:</h3>

                            <h3>Политика паролей</h3>
                            <ul>
                                <li>Минимальная длина (не менее 12 символов)</li>
                                <li>Сложность (буквы, цифры, спецсимволы)</li>
                                <li>Регулярная смена паролей</li>
                                <li>Запрет на повторное использование</li>
                            </ul>

                            <h3>Контроль доступа</h3>
                            <p>Принцип наименьших привилегий — пользователь получает только необходимые для работы права.</p>

                            <h3>Обучение персонала</h3>
                            <p>Регулярное проведение тренингов по безопасности, тесты на устойчивость к фишингу.</p>

                            <h3>Аудит и мониторинг</h3>
                            <p>Регулярная проверка журналов событий, выявление подозрительной активности.</p>
                        `,
                        question: 'Что такое принцип наименьших привилегий?',
                        answers: [
                            { text: 'Пользователь получает все возможные права доступа', correct: false },
                            { text: 'Пользователь получает только необходимые для работы права', correct: true },
                            { text: 'Администратор имеет минимальные права', correct: false },
                            { text: 'Все пользователи имеют равные права', correct: false }
                        ]
                    }
                ]
            },
            {
                id: 'security-crypto',
                badge: 'Средний',
                title: 'Криптография и защита данных',
                description: 'Изучение алгоритмов шифрования, цифровых подписей и сертификатов',
                lessons: 6,
                duration: '7 часов'
            },
            {
                id: 'security-network',
                badge: 'Средний',
                title: 'Сетевая безопасность',
                description: 'Защита сетевой инфраструктуры, настройка файрволов и систем обнаружения вторжений',
                lessons: 7,
                duration: '8 часов'
            },
            {
                id: 'security-pentest',
                badge: 'Продвинутый',
                title: 'Тестирование на проникновение',
                description: 'Методология пентестинга, инструменты анализа уязвимостей и этичный хакинг',
                lessons: 8,
                duration: '10 часов'
            },
            {
                id: 'security-incident',
                badge: 'Продвинутый',
                title: 'Реагирование на инциденты',
                description: 'Обнаружение, анализ и устранение последствий инцидентов ИБ',
                lessons: 6,
                duration: '7 часов'
            }
        ]
    }
};

// ========== Глобальные переменные ==========

let currentCourse = null;
let currentLessonIndex = 0;
let userAnswers = [];
let courseProgress = {};

// ========== Инициализация ==========

document.addEventListener('DOMContentLoaded', function() {
    loadProgress();

    const specialty = getSpecialtyFromURL();
    if (specialty && coursesData[specialty]) {
        renderCoursePage(specialty);
    }
});

// ========== Функции для работы со страницей специальности ==========

function getSpecialtyFromURL() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename.replace('.html', '');
}

function renderCoursePage(specialty) {
    const data = coursesData[specialty];
    if (!data) return;

    document.querySelector('.page-title').textContent = data.title;
    document.querySelector('.page-description').textContent = data.description;

    const coursesGrid = document.querySelector('.courses-grid');
    coursesGrid.innerHTML = '';

    data.courses.forEach(course => {
        const card = createCourseCard(course, specialty);
        coursesGrid.appendChild(card);
    });
}

function createCourseCard(course, specialty) {
    const div = document.createElement('div');
    div.className = 'course-card';

    const progress = getCourseProgress(specialty, course.id);
    const isCompleted = progress === 100;

    div.innerHTML = `
        <span class="course-badge">${course.badge}</span>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-description">${course.description}</p>
        <div class="course-meta">
            <span><i class="fas fa-book-open"></i> ${course.lessons} уроков</span>
            <span><i class="fas fa-clock"></i> ${course.duration}</span>
        </div>
        ${progress > 0 ? `
            <div class="progress-bar-container" style="margin-bottom: 16px;">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                Прогресс: ${progress}%
            </p>
        ` : ''}
        <button class="btn ${isCompleted ? 'btn-secondary' : ''}" onclick="startCourse('${specialty}', '${course.id}')">
            ${isCompleted ? '<i class="fas fa-redo"></i> Пройти заново' : '<i class="fas fa-play"></i> Начать обучение'}
        </button>
    `;

    return div;
}

// ========== Функции для работы с модальным окном ==========

function startCourse(specialty, courseId) {
    const data = coursesData[specialty];
    const course = data.courses.find(c => c.id === courseId);

    if (!course || !course.lessons_data) {
        alert('Материалы курса пока недоступны');
        return;
    }

    currentCourse = {
        specialty: specialty,
        courseId: courseId,
        data: course
    };

    currentLessonIndex = 0;
    userAnswers = [];

    openModal();
    renderLesson();
}

function openModal() {
    const modal = document.getElementById('learningModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('learningModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCourse = null;
}

function renderLesson() {
    if (!currentCourse) return;

    const lesson = currentCourse.data.lessons_data[currentLessonIndex];
    const totalLessons = currentCourse.data.lessons_data.length;

    document.querySelector('.modal-title').textContent = currentCourse.data.title;

    const progress = ((currentLessonIndex + 1) / totalLessons) * 100;
    document.querySelector('.progress-bar').style.width = progress + '%';
    document.querySelector('.lesson-info').innerHTML = `
        <span>Урок ${currentLessonIndex + 1} из ${totalLessons}</span>
        <span>${Math.round(progress)}%</span>
    `;

    const lessonsContainer = document.querySelector('.lessons-container');
    const completionScreen = document.querySelector('.completion-screen');

    lessonsContainer.style.display = 'block';
    completionScreen.classList.remove('active');

    document.querySelectorAll('.lesson').forEach(l => l.classList.remove('active'));

    let lessonElement = document.getElementById(`lesson-${currentLessonIndex}`);

    if (!lessonElement) {
        lessonElement = createLessonElement(lesson, currentLessonIndex);
        lessonsContainer.appendChild(lessonElement);
    }

    lessonElement.classList.add('active');

    updateButtons();
}

function createLessonElement(lesson, index) {
    const div = document.createElement('div');
    div.className = 'lesson';
    div.id = `lesson-${index}`;

    div.innerHTML = `
        <h2 class="lesson-title">${lesson.title}</h2>
        <div class="lesson-content">${lesson.content}</div>

        <div class="question-block">
            <h3 class="question-title"><i class="fas fa-question-circle"></i> Проверьте себя:</h3>
            <p style="margin-bottom: 16px;">${lesson.question}</p>
            <div class="answers" id="answers-${index}">
                ${lesson.answers.map((answer, i) => `
                    <div class="answer" data-lesson="${index}" data-answer="${i}" onclick="selectAnswer(${index}, ${i})">
                        <i class="far fa-circle"></i>
                        <span>${answer.text}</span>
                    </div>
                `).join('')}
            </div>
            <div class="feedback" id="feedback-${index}"></div>
        </div>
    `;

    return div;
}

function selectAnswer(lessonIndex, answerIndex) {
    const lesson = currentCourse.data.lessons_data[lessonIndex];
    const answers = document.querySelectorAll(`#answers-${lessonIndex} .answer`);

    answers.forEach(ans => {
        ans.classList.remove('selected', 'correct', 'incorrect');
        ans.querySelector('i').className = 'far fa-circle';
    });

    const selectedAnswer = answers[answerIndex];
    selectedAnswer.classList.add('selected');

    const isCorrect = lesson.answers[answerIndex].correct;

    answers.forEach((ans, i) => {
        if (lesson.answers[i].correct) {
            ans.classList.add('correct');
            ans.querySelector('i').className = 'fas fa-check-circle';
        } else if (i === answerIndex && !isCorrect) {
            ans.classList.add('incorrect');
            ans.querySelector('i').className = 'fas fa-times-circle';
        }
    });

    userAnswers[lessonIndex] = {
        selected: answerIndex,
        correct: isCorrect
    };

    const feedback = document.getElementById(`feedback-${lessonIndex}`);
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = isCorrect
        ? '<i class="fas fa-check-circle"></i> Правильно! Вы можете перейти к следующему уроку.'
        : '<i class="fas fa-times-circle"></i> Неправильно. Попробуйте ещё раз или изучите материал внимательнее.';

    updateButtons();
}

function updateButtons() {
    const totalLessons = currentCourse.data.lessons_data.length;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = currentLessonIndex > 0 ? 'inline-block' : 'none';

    const hasAnswered = userAnswers[currentLessonIndex] !== undefined;

    if (currentLessonIndex < totalLessons - 1) {
        nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Следующий урок';
        nextBtn.disabled = !hasAnswered;
        nextBtn.onclick = nextLesson;
    } else {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> Завершить курс';
        nextBtn.disabled = !hasAnswered;
        nextBtn.onclick = completeCourse;
    }
}

function prevLesson() {
    if (currentLessonIndex > 0) {
        currentLessonIndex--;
        renderLesson();
    }
}

function nextLesson() {
    const totalLessons = currentCourse.data.lessons_data.length;
    if (currentLessonIndex < totalLessons - 1) {
        currentLessonIndex++;
        renderLesson();
    }
}

function completeCourse() {
    const correctAnswers = userAnswers.filter(a => a.correct).length;
    const totalLessons = currentCourse.data.lessons_data.length;
    const percentage = Math.round((correctAnswers / totalLessons) * 100);

    saveCourseProgress(currentCourse.specialty, currentCourse.courseId, 100);

    document.querySelector('.lessons-container').style.display = 'none';

    const completionScreen = document.querySelector('.completion-screen');
    completionScreen.classList.add('active');
    completionScreen.innerHTML = `
        <div class="completion-icon">
            <i class="fas fa-trophy"></i>
        </div>
        <h2 class="completion-title">Поздравляем! Курс завершён!</h2>
        <p class="completion-message">Вы успешно прошли курс "${currentCourse.data.title}"</p>

        <div class="completion-stats">
            <div class="stat">
                <span class="stat-value">${correctAnswers}/${totalLessons}</span>
                <span class="stat-label">Правильных ответов</span>
            </div>
            <div class="stat">
                <span class="stat-value">${percentage}%</span>
                <span class="stat-label">Результат</span>
            </div>
        </div>

        <div style="display: flex; gap: 16px; justify-content: center;">
            <button class="btn" onclick="restartCourse()">
                <i class="fas fa-redo"></i> Пройти заново
            </button>
            <button class="btn btn-secondary" onclick="closeModal()">
                <i class="fas fa-arrow-left"></i> К списку курсов
            </button>
        </div>
    `;

    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
}

function restartCourse() {
    if (!currentCourse) return;

    currentLessonIndex = 0;
    userAnswers = [];

    document.querySelectorAll('.lesson').forEach(lesson => {
        lesson.querySelectorAll('.answer').forEach(ans => {
            ans.classList.remove('selected', 'correct', 'incorrect');
            ans.querySelector('i').className = 'far fa-circle';
        });
        lesson.querySelectorAll('.feedback').forEach(fb => {
            fb.classList.remove('show');
        });
    });

    renderLesson();
}

// ========== Работа с прогрессом (localStorage) ==========

function loadProgress() {
    const saved = localStorage.getItem('courseProgress');
    if (saved) {
        try {
            courseProgress = JSON.parse(saved);
        } catch (e) {
            courseProgress = {};
        }
    }
}

function saveProgress() {
    localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
}

function saveCourseProgress(specialty, courseId, progress) {
    if (!courseProgress[specialty]) {
        courseProgress[specialty] = {};
    }
    courseProgress[specialty][courseId] = progress;
    saveProgress();
}

function getCourseProgress(specialty, courseId) {
    if (courseProgress[specialty] && courseProgress[specialty][courseId]) {
        return courseProgress[specialty][courseId];
    }
    return 0;
}

// ========== Закрытие модального окна по клику вне его ==========

document.addEventListener('click', function(e) {
    const modal = document.getElementById('learningModal');
    if (e.target === modal) {
        closeModal();
    }
});
