import {
  doc, getDoc, updateDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ═══════════════════════════════════════════════════════════
//  CURRICULUM DATA — встроенный контент, без Firestore
// ═══════════════════════════════════════════════════════════
const UNITS = [
  {
    id: 'unit-1',
    title: 'Python негіздері',
    subtitle: 'Айнымалылар, типтер, операциялар',
    color: '#58cc02',
    darkColor: '#46a302',
    icon: '🌱',
    lessons: [
      { id:'u1l1', type:'lesson', title:'Сәлем, Дүние!',        desc:'print() функциясымен алғашқы бағдарламаны жазамыз',        emoji:'👋', xp:10, topics:['print()','синтаксис'] },
      { id:'u1l2', type:'lesson', title:'Айнымалылар',           desc:'Деректерді айнымалыларда сақтаймыз',                       emoji:'📦', xp:10, topics:['=','var','naming'] },
      { id:'u1l3', type:'quiz',   title:'Квиз: негіздер',        desc:'Алғашқы тақырыптар бойынша тексеру',                       emoji:'❓', xp:20, topics:['print','айнымалы'] },
      { id:'u1l4', type:'lesson', title:'Деректер типтері',       desc:'int, float, str, bool — негізгі типтер',                   emoji:'🔢', xp:10, topics:['int','float','str','bool'] },
      { id:'u1l5', type:'lesson', title:'Кіріс: input()',         desc:'Пайдаланушыдан деректер аламыз',                           emoji:'⌨️', xp:10, topics:['input()','str()','int()'] },
      { id:'u1l6', type:'lesson', title:'Арифметикалық операциялар', desc:'+, -, *, /, //, %, ** операторлары',                   emoji:'➕', xp:10, topics:['+','-','*','/','%','**'] },
      { id:'u1l7', type:'checkpoint', title:'1-бөлім бітті!',    desc:'Алғашқы бөлімді аяқтадың',                                emoji:'🏆', xp:30, topics:[] },
    ]
  },
  {
    id: 'unit-2',
    title: 'Шарттар мен циклдар',
    subtitle: 'if/else, for, while — басқару',
    color: '#1cb0f6',
    darkColor: '#0a9ee0',
    icon: '🔀',
    lessons: [
      { id:'u2l1', type:'lesson', title:'if / else шарттары',    desc:'Шарттарға байланысты код тармақтары',                      emoji:'🤔', xp:10, topics:['if','elif','else'] },
      { id:'u2l2', type:'lesson', title:'Салыстыру операторлары', desc:'==, !=, >, <, >=, <= операторлары',                       emoji:'⚖️', xp:10, topics:['==','!=','>','<'] },
      { id:'u2l3', type:'quiz',   title:'Квиз: шарттар',         desc:'if/else тақырыбын тексеру',                                emoji:'❓', xp:20, topics:['if','else'] },
      { id:'u2l4', type:'lesson', title:'for циклі',              desc:'Тізбекті қайталау үшін for',                              emoji:'🔄', xp:10, topics:['for','range()','in'] },
      { id:'u2l5', type:'lesson', title:'while циклі',            desc:'Шарт орындалғанша цикл',                                  emoji:'♾️', xp:10, topics:['while','break','continue'] },
      { id:'u2l6', type:'lesson', title:'break / continue',       desc:'Циклды үзу немесе өткізу',                               emoji:'⏭️', xp:10, topics:['break','continue'] },
      { id:'u2l7', type:'checkpoint', title:'2-бөлім бітті!',    desc:'Шарттар мен циклдарды меңгердің',                         emoji:'🏆', xp:30, topics:[] },
    ]
  },
  {
    id: 'unit-3',
    title: 'Функциялар',
    subtitle: 'Кодты бөліктерге бөлу',
    color: '#ff9600',
    darkColor: '#d47c00',
    icon: '⚙️',
    lessons: [
      { id:'u3l1', type:'lesson', title:'Функция анықтау',        desc:'def арқылы өз функцияңды жаса',                           emoji:'🔧', xp:10, topics:['def','функция'] },
      { id:'u3l2', type:'lesson', title:'Параметрлер',            desc:'Функцияға деректер беру',                                 emoji:'📥', xp:10, topics:['параметр','аргумент'] },
      { id:'u3l3', type:'lesson', title:'return мәні',            desc:'Функциядан нәтиже қайтару',                               emoji:'📤', xp:10, topics:['return'] },
      { id:'u3l4', type:'quiz',   title:'Квиз: функциялар',       desc:'Функциялар тақырыбын тексеру',                            emoji:'❓', xp:20, topics:['def','return'] },
      { id:'u3l5', type:'lesson', title:'Default параметрлер',    desc:'Функция параметрлерінің үндемелі мәндері',               emoji:'🎛️', xp:10, topics:['default','keyword'] },
      { id:'u3l6', type:'lesson', title:'*args және **kwargs',     desc:'Белгісіз санды аргументтер',                             emoji:'🌟', xp:15, topics:['*args','**kwargs'] },
      { id:'u3l7', type:'checkpoint', title:'3-бөлім бітті!',    desc:'Функцияларды игердің',                                    emoji:'🏆', xp:30, topics:[] },
    ]
  },
  {
    id: 'unit-4',
    title: 'Деректер құрылымы',
    subtitle: 'list, tuple, dict, set',
    color: '#ce82ff',
    darkColor: '#a855f7',
    icon: '📋',
    lessons: [
      { id:'u4l1', type:'lesson', title:'Тізімдер (list)',         desc:'Деректер жиынтығын тізімде сақтау',                       emoji:'📝', xp:10, topics:['list','[]','append'] },
      { id:'u4l2', type:'lesson', title:'Тізім әдістері',          desc:'append, remove, sort, len, slice',                        emoji:'🔨', xp:10, topics:['append','sort','len','slice'] },
      { id:'u4l3', type:'lesson', title:'Кортеждер (tuple)',       desc:'Өзгермейтін тізімдер',                                    emoji:'🔒', xp:10, topics:['tuple','()','immutable'] },
      { id:'u4l4', type:'quiz',   title:'Квиз: list & tuple',      desc:'Тізімдер мен кортеждер',                                  emoji:'❓', xp:20, topics:['list','tuple'] },
      { id:'u4l5', type:'lesson', title:'Сөздіктер (dict)',        desc:'Кілт-мән жұбымен деректер',                               emoji:'📖', xp:10, topics:['dict','{}','.get()'] },
      { id:'u4l6', type:'lesson', title:'Жиындар (set)',           desc:'Бірегей элементтер жинағы',                               emoji:'🎯', xp:10, topics:['set','union','intersection'] },
      { id:'u4l7', type:'checkpoint', title:'4-бөлім бітті!',     desc:'Деректер құрылымдарын игердің',                           emoji:'🏆', xp:30, topics:[] },
    ]
  },
  {
    id: 'unit-5',
    title: 'ООП негіздері',
    subtitle: 'Класстар мен объектілер',
    color: '#1fe0c0',
    darkColor: '#0ab5a0',
    icon: '🏛️',
    lessons: [
      { id:'u5l1', type:'lesson', title:'Класс жасау',             desc:'class арқылы өз деректер типіңді жаса',                   emoji:'🏗️', xp:10, topics:['class','object'] },
      { id:'u5l2', type:'lesson', title:'__init__ әдісі',          desc:'Объектіні инициализациялау',                              emoji:'⚡', xp:10, topics:['__init__','self'] },
      { id:'u5l3', type:'lesson', title:'Әдістер (Methods)',       desc:'Класс ішіндегі функциялар',                               emoji:'🔨', xp:10, topics:['method','self'] },
      { id:'u5l4', type:'quiz',   title:'Квиз: класстар',          desc:'ООП негіздерін тексеру',                                  emoji:'❓', xp:20, topics:['class','__init__'] },
      { id:'u5l5', type:'lesson', title:'Мұрагерлік',              desc:'Класстан класс мұраланады',                               emoji:'👨‍👧', xp:15, topics:['inheritance','super()'] },
      { id:'u5l6', type:'lesson', title:'Инкапсуляция',            desc:'Деректерді жасырып қорғау',                               emoji:'🛡️', xp:15, topics:['private','__attr'] },
      { id:'u5l7', type:'checkpoint', title:'5-бөлім бітті!',     desc:'ООП-ты игердің',                                          emoji:'🏆', xp:30, topics:[] },
    ]
  },
  {
    id: 'unit-6',
    title: 'Жетілдірілген Python',
    subtitle: 'Алгоритмдер, файлдар, сыртқы кітапханалар',
    color: '#ffd900',
    darkColor: '#c9a800',
    icon: '🚀',
    lessons: [
      { id:'u6l1', type:'lesson', title:'Файлдармен жұмыс',        desc:'Файлды ашу, оқу, жазу',                                  emoji:'📁', xp:10, topics:['open()','read()','write()'] },
      { id:'u6l2', type:'lesson', title:'Ерекше жағдайлар',        desc:'try, except, finally',                                    emoji:'⚠️', xp:10, topics:['try','except','finally'] },
      { id:'u6l3', type:'lesson', title:'List Comprehension',      desc:'Тізімдерді бір жолда жасау',                             emoji:'✨', xp:15, topics:['comprehension','lambda'] },
      { id:'u6l4', type:'lesson', title:'Декораторлар',            desc:'@decorator — функцияны әшекейлеу',                       emoji:'🎨', xp:15, topics:['@decorator','wrapper'] },
      { id:'u6l5', type:'quiz',   title:'Квиз: жетілдірілген',     desc:'Жоғары деңгей тақырыптарын тексеру',                     emoji:'❓', xp:25, topics:['файл','decorator'] },
      { id:'u6l6', type:'boss',   title:'ФИНАЛ БОССЫ: Python Мастер!', desc:'Барлық тақырыптар бойынша соңғы сынақ. Дайынсың ба?', emoji:'🐉', xp:100, topics:['бәрі'] },
    ]
  }
];

// Zigzag path — точно как Duolingo
const ZIGZAG = [0, 60, 90, 60, 0, -60, -90, -60];

// ═══════════════════════════════════════════════════════════
//  EXERCISES — нағыз тапсырмалар банкі (Duolingo-стиль)
// ═══════════════════════════════════════════════════════════
const Q    = (q, o, c, e='') => ({ type:'mcq',    q, o, c, e });
const TF   = (q, c, e='')    => ({ type:'tf',     q, c, e });
const OUT  = (code, o, c, e='') => ({ type:'output', code, q:'Бұл код нені шығарады?', o, c, e });
const FILL = (q, code, a, e='') => ({ type:'fill', q, code, a:(Array.isArray(a)?a:[a]), e });

const EXERCISES = {
  u1l1: [
    Q('Python-да экранға мәтін шығаратын функция қандай?', ['print()','echo()','output()','display()'], 0, '"print()" — Python-дағы негізгі шығару функциясы.'),
    OUT('print("Сәлем, Python!")', ['Сәлем, Python!','"Сәлем, Python!"','print','Қате шығады'], 0, 'print() тырнақшаларды көрсетпей, тек мәтінді шығарады.'),
  ],
  u1l2: [
    Q('"x = 5" жолында "=" белгісі нені білдіреді?', ['Теңдікті тексеру','Мәнді айнымалыға меншіктеу','Салыстыру','Ештеңе'], 1, 'Python-да жалғыз "=" мәнді айнымалыға меншіктеу үшін қолданылады.'),
    TF('Айнымалы атауы санмен басталуы мүмкін (мысалы 2name).', false, 'Python айнымалылары әріптен немесе "_" таңбасынан басталуы керек.'),
  ],
  u1l3: [
    Q('Қайсысы дұрыс жазылған print()?', ['print "Сәлем"','print("Сәлем")','Print("Сәлем")','print[Сәлем]'], 1),
    Q('y = 10 деп жазылса, y қандай мәнге ие болады?', ['"10"','10','y','Қате'], 1),
    TF('print(2+2) нәтижесінде 4 саны экранға шығады.', true),
  ],
  u1l4: [
    Q('"Айгүл" деректер типі қандай?', ['int','float','str','bool'], 2, 'Тырнақшаға алынған мән — жол (string).'),
    Q('type(3.14) нені қайтарады?', ['int','float','str','bool'], 1),
  ],
  u1l5: [
    Q('input() функциясы әдетте қандай типте мән қайтарады?', ['int','float','str','bool'], 2, 'input() әрқашан жол (str) түрінде қайтарады, тіпті сан енгізсеңіз де.'),
    FILL('Жасты санға айналдыру үшін бос орынды толтыр:', 'age = ___(input())', ['int'], 'Жолды бүтін санға айналдыру үшін int() қолданылады.'),
  ],
  u1l6: [
    Q('17 // 5 нәтижесі қандай?', ['3.4','3','2','17'], 1, '// — бүтін бөлу, қалдықсыз нәтиже береді.'),
    Q('2 ** 3 нәтижесі қандай?', ['6','8','9','5'], 1, '** — дәрежеге шығару: 2 үш дәрежеде = 8.'),
    OUT('print(10 % 3)', ['3','1','0','10'], 1, '% — қалдықты табады: 10-ды 3-ке бөлгенде қалдық 1.'),
  ],
  u2l1: [
    Q('if шартының қасында жазылатын ":" белгісі нені білдіреді?', ['Циклдың аяқталуын','Блоктың басталуын','Қатені','Ешнәрсе'], 1, '":" — блок (отступ) кодының басталуын білдіреді.'),
    TF('elif тек if-тен кейін жазылады, ол жеке тұра алмайды.', true),
  ],
  u2l2: [
    Q('5 != 5 нәтижесі қандай?', ['True','False','5','Error'], 1),
    OUT('print(7 > 3 and 2 < 1)', ['True','False','Error','7'], 1, 'and операторы екі шарт та True болғанда ғана True қайтарады.'),
  ],
  u2l3: [
    Q('if x > 10:\n    print("үлкен")\nкодында x=5 болса, не болады?', ['"үлкен" басылады','Ешнәрсе басылмайды','Қате шығады','x=10 болады'], 1),
    Q('Қайсысы дұрыс салыстыру операторы?', ['=>','=<','>=','=>'], 2),
    TF('elif бірнеше рет қолданылуы мүмкін.', true),
  ],
  u2l4: [
    Q('range(5) қанша рет қайталанады?', ['4','5','6','0'], 1, 'range(5) — 0-ден 4-ке дейін, барлығы 5 мән.'),
    OUT('for i in range(3):\n    print(i)', ['0 1 2','1 2 3','0 1 2 3','3'], 0),
  ],
  u2l5: [
    Q('while циклі қашан тоқтайды?', ['Ешқашан','Шарт False болғанда','1 реттен кейін','Кездейсоқ'], 1),
    TF('while True: циклі break болмаса шексіз жұмыс істейді.', true),
  ],
  u2l6: [
    Q('break операторы нені істейді?', ['Циклды толығымен тоқтатады','Келесі итерацияға өтеді','Ештеңе істемейді','Қате шығарады'], 0),
    Q('continue операторы нені істейді?', ['Циклды тоқтатады','Ағымдағы итерацияны өткізіп, келесіге өтеді','Бағдарламаны тоқтатады','Айнымалыны өшіреді'], 1),
  ],
  u3l1: [
    Q('Функция анықтау үшін қандай түйінді сөз қолданылады?', ['func','define','def','function'], 2),
    TF('Функция атауы сан тіркесінен басталуы мүмкін.', false),
  ],
  u3l2: [
    Q('def greet(name): жолындағы "name" не болады?', ['Айнымалы мән','Параметр','Функция атауы','Қате'], 1),
    OUT('def add(a, b):\n    return a + b\nprint(add(2, 3))', ['5','23','Error','a+b'], 0),
  ],
  u3l3: [
    Q('return операторы нені істейді?', ['Функцияны шақырады','Функциядан мән қайтарып, оны тоқтатады','Циклды тоқтатады','Айнымалы жасайды'], 1),
    TF('return жазылмаған функция автоматты түрде None қайтарады.', true),
  ],
  u3l4: [
    Q('def f(): pass дегенде f() не қайтарады?', ['0','None','Error',''], 1),
    OUT('def square(x):\n    return x*x\nprint(square(4))', ['8','16','4','x*x'], 1),
    Q('Функцияны шақыру үшін не керек?', ['Тек атауын жазу','Атауы + жақша ()','def сөзі','return сөзі'], 1),
  ],
  u3l5: [
    Q('def greet(name="Дос"): жолында "Дос" нені білдіреді?', ['Міндетті мән','Үндемелі (default) мән','Қате','Тип'], 1),
    OUT('def greet(name="Дос"):\n    print("Сәлем,", name)\ngreet()', ['Сәлем, Дос','Сәлем,','Error','Сәлем, name'], 0),
  ],
  u3l6: [
    Q('*args функцияда нені білдіреді?', ['Белгілі бір аргумент','Белгісіз санды позициялық аргументтер','Сөздік','Қате'], 1),
    Q('**kwargs нені қабылдайды?', ['Тізім','Кілт-мән жұптарын','Бір ғана санды','Ештеңе'], 1),
  ],
  u4l1: [
    Q('Тізім қалай жасалады?', ['{}','()','[]','<>'], 2),
    OUT('a = [1,2,3]\nprint(a[0])', ['1','2','3','Error'], 0, 'Индекс 0-ден басталады.'),
  ],
  u4l2: [
    Q('append() әдісі нені істейді?', ['Тізімнен элемент өшіреді','Тізімнің соңына элемент қосады','Тізімді сұрыптайды','Тізімді көшіреді'], 1),
    OUT('a = [3,1,2]\na.sort()\nprint(a)', ['[3,1,2]','[1,2,3]','[2,1,3]','Error'], 1),
  ],
  u4l3: [
    Q('Кортеж (tuple) тізімнен немен ерекшеленеді?', ['Жылдамдығымен','Өзгермейтіндігімен (immutable)','Түсімен','Ештеңемен'], 1),
    TF('Кортеж дөңгелек жақшамен () жазылады.', true),
  ],
  u4l4: [
    Q('a = [1,2,3]; a.append(4) кейін a неге тең?', ['[1,2,3]','[1,2,3,4]','[4,1,2,3]','Error'], 1),
    TF('Tuple-дың элементтерін өзгертуге болады.', false),
    Q('len([1,2,3,4]) нәтижесі қандай?', ['3','4','5','Error'], 1),
  ],
  u4l5: [
    Q('Сөздік (dict) қалай жазылады?', ['[]','()','{}','<>'], 2),
    OUT('d = {"name":"Айдос"}\nprint(d["name"])', ['name','"Айдос"','Айдос','Error'], 2),
  ],
  u4l6: [
    Q('Жиын (set) элементтерінің ерекшелігі қандай?', ['Қайталанады','Бірегей (қайталанбайды)','Реттелген','Өзгермейтін'], 1),
    TF('set() жиынында бірдей элементтер бірнеше рет сақталады.', false),
  ],
  u5l1: [
    Q('Класс анықтау үшін қандай түйінді сөз қолданылады?', ['def','class','object','struct'], 1),
    TF('Объект — бұл класстың нақты данасы (instance).', true),
  ],
  u5l2: [
    Q('__init__ әдісі қашан шақырылады?', ['Класс жойылғанда','Жаңа объект жасалғанда','Әдіс шақырылғанда','Ешқашан'], 1),
    Q('self параметрі нені білдіреді?', ['Класс атауын','Ағымдағы объектінің өзін','Функция нәтижесін','Ештеңе'], 1),
  ],
  u5l3: [
    Q('Класс ішіндегі функциялар қалай аталады?', ['Процедуралар','Әдістер (methods)','Модульдер','Атрибуттар'], 1),
    TF('Әдіс шақырылғанда self автоматты түрде беріледі.', true),
  ],
  u5l4: [
    Q('class Dog:\n    def __init__(self, name):\n        self.name = name\nd = Dog("Боско")\nprint(d.name) нәтижесі?', ['Dog','name','Боско','Error'], 2),
    Q('__init__ әдісінің тағы бір аты қалай аталады?', ['Конструктор','Деструктор','Циклдатор','Итератор'], 0),
    TF('Бір класстан бірнеше объект жасауға болады.', true),
  ],
  u5l5: [
    Q('Мұрагерлік (inheritance) нені білдіреді?', ['Класс өзгерту','Класстың басқа класстан қасиет алуын','Функция шақыру','Айнымалы жасау'], 1),
    Q('super() функциясы не үшін қолданылады?', ['Аталық класстың әдістеріне қол жеткізу үшін','Жаңа класс жасау үшін','Циклды бастау үшін','Қате шығару үшін'], 0),
  ],
  u5l6: [
    Q('Инкапсуляция дегеніміз не?', ['Деректерді жасырып қорғау','Деректерді ашық қылу','Циклдау','Мұрагерлік'], 0),
    TF('Python-да атрибут атауының алдында "__" қою оны жартылай жасырын етеді.', true),
  ],
  u6l1: [
    Q('Файлды ашу үшін қандай функция қолданылады?', ['file()','open()','read()','load()'], 1),
    TF('"w" режимі файлды оқу үшін қолданылады.', false, '"w" — жазу (write) режимі, оқу үшін "r" қолданылады.'),
  ],
  u6l2: [
    Q('Қате орын алса, қай блок орындалады?', ['try','except','finally','def'], 1),
    TF('finally блогы қате болса да, болмаса да әрқашан орындалады.', true),
  ],
  u6l3: [
    Q('[x*2 for x in range(3)] нәтижесі қандай?', ['[0,2,4]','[1,2,3]','[2,4,6]','Error'], 0),
    OUT('print([x for x in range(5) if x%2==0])', ['[0,1,2,3,4]','[0,2,4]','[1,3]','Error'], 1),
  ],
  u6l4: [
    Q('Декоратор қандай таңбадан басталады?', ['#','@','$','&'], 1),
    TF('Декоратор функцияны өзгертпей-ақ оның жұмысын кеңейте алады.', true),
  ],
  u6l5: [
    Q('open("file.txt", "r") дегендегі "r" нені білдіреді?', ['Write','Read','Remove','Run'], 1),
    Q('[x for x in range(4)] нәтижесі?', ['[0,1,2,3]','[1,2,3,4]','[0,1,2,3,4]','Error'], 0),
    TF('try/except қолданбай тұрып бағдарлама қатеде толығымен тоқтайды.', true),
  ],
};

// ═══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════
export async function initPythonPath(user, db) {
  const roadmapEl = document.getElementById('pythonRoadmap');
  const statsEl   = document.getElementById('pythonPathStats');
  if (!roadmapEl) return;

  injectStyles();

  // Show skeleton loader
  roadmapEl.innerHTML = `<div class="pp-loading"><div class="pp-spinner"></div><span>Python жолы жүктелуде...</span></div>`;

  // Load user progress from Firestore
  let progress = {};
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) progress = snap.data().pythonPath || {};
  } catch(e) { console.warn('Progress load failed:', e); }

  const completed = new Set(Object.keys(progress).filter(k => progress[k] === 'done'));
  const xp        = Object.values(progress).reduce((s,v) => s + (typeof v === 'number' ? v : 0), 0);
  const streak    = await loadStreak(db, user.uid);

  // Clear and render
  roadmapEl.innerHTML = '';
  if (statsEl) renderHeader(statsEl, xp, streak, completed);
  renderPath(roadmapEl, completed);
  attachHandlers(roadmapEl, db, user, completed, progress);
}

async function loadStreak(db, uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().streak || 0) : 0;
  } catch { return 0; }
}

// ═══════════════════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════════════════
function renderHeader(el, xp, streak, completed) {
  const totalLessons = UNITS.reduce((s,u) => s + u.lessons.length, 0);
  const pct = Math.round(completed.size / totalLessons * 100);
  const level = Math.floor(xp / 200) + 1;
  const xpInLv = xp % 200;

  el.innerHTML = `
  <div class="pp-header">
    <div class="pp-hdr-item">
      <div class="pp-hdr-streak">
        <span class="pp-fire-icon">🔥</span>
        <span class="pp-hdr-big">${streak}</span>
      </div>
      <div class="pp-hdr-lbl">Тізбек</div>
    </div>
    <div class="pp-hdr-item">
      <div class="pp-xp-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg4)" stroke-width="7"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke="#ffd900" stroke-width="7"
            stroke-linecap="round"
            stroke-dasharray="${(2*Math.PI*26).toFixed(1)}"
            stroke-dashoffset="${(2*Math.PI*26*(1-xpInLv/200)).toFixed(1)}"
            transform="rotate(-90 32 32)"/>
        </svg>
        <span class="pp-ring-lv">${level}</span>
      </div>
      <div class="pp-hdr-lbl">${xpInLv}/200 XP</div>
    </div>
    <div class="pp-hdr-item">
      <div class="pp-hdr-big pp-hdr-green">⚡${xp}</div>
      <div class="pp-hdr-lbl">Жалпы XP</div>
    </div>
    <div class="pp-hdr-item">
      <div class="pp-hdr-big pp-hdr-blue">${pct}%</div>
      <div class="pp-hdr-lbl">${completed.size}/${totalLessons} өтілді</div>
    </div>
    <div class="pp-hdr-item">
      <div class="pp-hearts">
        ${'❤️'.repeat(5)}
      </div>
      <div class="pp-hdr-lbl">Жүректер</div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RENDER PATH
// ═══════════════════════════════════════════════════════════
function renderPath(container, completed) {
  // Build flat list to determine unlocked
  const flat = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unitId: u.id, unit: u })));
  const unlocked = buildUnlocked(flat, completed);

  UNITS.forEach((unit, ui) => {
    // ── Unit Header / Banner ──────────────────────────────
    const doneInUnit = unit.lessons.filter(l => completed.has(l.id)).length;
    const totalInUnit = unit.lessons.length;
    const unitDone = doneInUnit === totalInUnit;
    const unitActive = !unitDone && unit.lessons.some(l => unlocked.has(l.id));
    const unitLocked = !unitDone && !unitActive;

    const banner = document.createElement('div');
    banner.className = `pp-unit-banner${unitLocked ? ' pp-unit-locked' : ''}`;
    banner.style.setProperty('--uc', unit.color);
    banner.style.setProperty('--ud', unit.darkColor);
    banner.innerHTML = `
    <div class="pp-unit-left">
      <div class="pp-unit-icon">${unit.icon}</div>
      <div>
        <div class="pp-unit-section">БӨЛІМ ${ui+1}</div>
        <div class="pp-unit-title">${unit.title}</div>
        <div class="pp-unit-sub">${unit.subtitle}</div>
      </div>
    </div>
    <div class="pp-unit-right">
      <div class="pp-unit-prog">
        <div class="pp-unit-prog-bar">
          <div class="pp-unit-prog-fill" style="width:${Math.round(doneInUnit/totalInUnit*100)}%"></div>
        </div>
        <div class="pp-unit-prog-txt">${doneInUnit}/${totalInUnit}</div>
      </div>
      ${unitDone ? '<div class="pp-unit-done-badge">✓ Бітті</div>' : ''}
      ${unitLocked ? '<div class="pp-unit-lock">🔒</div>' : ''}
    </div>`;
    container.appendChild(banner);

    // ── Lessons zigzag ───────────────────────────────────
    const track = document.createElement('div');
    track.className = 'pp-track';

    unit.lessons.forEach((lesson, li) => {
      const done    = completed.has(lesson.id);
      const unl     = unlocked.has(lesson.id);
      const current = unl && !done;
      const locked  = !unl && !done;

      const isFirstCurrent = current &&
        flat.find(f => unlocked.has(f.id) && !completed.has(f.id))?.id === lesson.id;

      const off = ZIGZAG[(li) % ZIGZAG.length];

      const wrap = document.createElement('div');
      wrap.className = 'pp-node-wrap';
      wrap.style.marginLeft = `calc(50% + ${off}px - 36px)`;

      let nodeClass = 'pp-node';
      if (done)    nodeClass += ' pp-n-done';
      if (current) nodeClass += ' pp-n-current';
      if (locked)  nodeClass += ' pp-n-locked';
      if (lesson.type === 'boss') nodeClass += ' pp-n-boss';
      if (lesson.type === 'checkpoint') nodeClass += ' pp-n-check';

      const iconContent = done
        ? (lesson.type === 'checkpoint' ? '🏆' : '✓')
        : locked
          ? '🔒'
          : (lesson.type === 'checkpoint' ? '⭐' : lesson.emoji);

      // Show "START" arrow only above the very first current lesson
      const startArrow = isFirstCurrent
        ? `<div class="pp-start-arrow">
             <div class="pp-start-label">БАСТАУ!</div>
             <div class="pp-start-chevron">▼</div>
           </div>`
        : '';

      // Connector line between nodes (except last)
      const connector = li < unit.lessons.length - 1
        ? `<div class="pp-connector ${done ? 'pp-conn-done' : ''}"></div>`
        : '';

      wrap.innerHTML = `
      ${startArrow}
      <div class="${nodeClass}" data-id="${lesson.id}" data-unit="${unit.id}"
           data-type="${lesson.type}" data-unl="${unl}" style="--nc:${unit.color};--nd:${unit.darkColor}">
        <div class="pp-node-circle">
          <span class="pp-node-emoji">${iconContent}</span>
          ${current ? '<div class="pp-node-ring"></div>' : ''}
        </div>
        <div class="pp-node-name">${lesson.title}</div>
        ${done ? `<div class="pp-node-xp">+${lesson.xp} XP</div>` : ''}
      </div>
      ${connector}`;

      track.appendChild(wrap);
    });

    container.appendChild(track);
  });

  // Finish line
  const finish = document.createElement('div');
  finish.className = 'pp-finish';
  finish.innerHTML = `
  <div class="pp-finish-box">
    <div class="pp-finish-trophy">🏆</div>
    <div class="pp-finish-title">Python Developer!</div>
    <div class="pp-finish-sub">Барлық бөлімдерді аяқтап, Python мастері болдың!</div>
    <div class="pp-finish-gems">💎 💎 💎</div>
  </div>`;
  container.appendChild(finish);
}

// ═══════════════════════════════════════════════════════════
//  UNLOCKED SET
// ═══════════════════════════════════════════════════════════
function buildUnlocked(flat, completed) {
  const u = new Set();
  // First lesson always unlocked
  if (flat.length) u.add(flat[0].id);
  flat.forEach((item, i) => {
    if (completed.has(item.id) && i + 1 < flat.length) {
      u.add(flat[i+1].id);
    }
  });
  return u;
}

// ═══════════════════════════════════════════════════════════
//  CLICK HANDLERS
// ═══════════════════════════════════════════════════════════
function attachHandlers(container, db, user, completed, progress) {
  const flat = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));

  container.querySelectorAll('.pp-node').forEach(node => {
    node.addEventListener('click', () => {
      const id   = node.dataset.id;
      const unl  = node.dataset.unl === 'true';
      const lesson = flat.find(f => f.id === id);
      if (!lesson) return;

      if (!unl) {
        ppToast('🔒 Алдыңғы сабақты аяқта!');
        node.classList.add('pp-shake');
        setTimeout(() => node.classList.remove('pp-shake'), 500);
        return;
      }
      openModal(lesson, completed.has(id), db, user, completed, progress, container);
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════
const TYPE_COLOR = { lesson:'#1cb0f6', quiz:'#ffd900', boss:'#ff4b4b', checkpoint:'#58cc02', task:'#58cc02' };
const TYPE_LABEL = { lesson:'Сабақ', quiz:'Квиз', boss:'Босс', checkpoint:'Бөлім соңы', task:'Тапсырма' };
const TYPE_START = { lesson:'Сабақты бастау', quiz:'Квизге кіру', boss:'Боспен шайқас ⚔️', checkpoint:'Алға →', task:'Тапсырманы орындау' };

function openModal(lesson, isDone, db, user, completed, progress, container) {
  document.getElementById('ppModal')?.remove();

  const tc = TYPE_COLOR[lesson.type] || '#1cb0f6';
  const unitColor = lesson.unit?.color || '#58cc02';
  const topics = (lesson.topics||[]).filter(Boolean).map(t => `<span class="pp-pill">${t}</span>`).join('');

  const ov = document.createElement('div');
  ov.id = 'ppModal';
  ov.className = 'pp-overlay';
  ov.innerHTML = `
  <div class="pp-modal">
    <button class="pp-modal-x" id="ppClose">✕</button>
    <div class="pp-modal-top" style="background:${unitColor}18">
      <div class="pp-modal-emoji">${lesson.emoji}</div>
      <div class="pp-modal-badge" style="color:${tc};background:${tc}18">${TYPE_LABEL[lesson.type]||'Сабақ'}</div>
    </div>
    <div class="pp-modal-body">
      <h3 class="pp-modal-title">${esc(lesson.title)}</h3>
      <p class="pp-modal-desc">${esc(lesson.desc)}</p>
      ${topics ? `<div class="pp-modal-topics">${topics}</div>` : ''}
      <div class="pp-modal-xp">⚡ ${lesson.xp} XP</div>
      ${isDone ? '<div class="pp-modal-done">✅ Аяқталды</div>' : ''}
    </div>
    <div class="pp-modal-footer">
      ${isDone
        ? `<button class="pp-mbtn pp-mbtn-outline" id="ppRepeat">🔄 Қайталау</button>`
        : `<button class="pp-mbtn pp-mbtn-main" id="ppStart" style="background:${unitColor};box-shadow:0 4px 0 ${lesson.unit?.darkColor||'#46a302'}">${TYPE_START[lesson.type]||'Бастау'}</button>`
      }
      <button class="pp-mbtn pp-mbtn-outline" id="ppClose2">Жабу</button>
    </div>
  </div>`;

  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('pp-overlay-show'));

  const close = () => {
    ov.classList.remove('pp-overlay-show');
    setTimeout(() => ov.remove(), 240);
  };
  ov.querySelector('#ppClose').onclick = close;
  ov.querySelector('#ppClose2').onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };

  const startBtn = ov.querySelector('#ppStart') || ov.querySelector('#ppRepeat');
  startBtn?.addEventListener('click', () => {
    close();
    openLessonPlayer(lesson, isDone, db, user, completed, progress, container);
  });
}

// ═══════════════════════════════════════════════════════════
//  MARK DONE
// ═══════════════════════════════════════════════════════════
async function markDone(lesson, db, user, completed, progress, container, earnedXP) {
  const xp = (earnedXP != null) ? earnedXP : lesson.xp;
  const alreadyDone = completed.has(lesson.id);
  completed.add(lesson.id);
  progress[lesson.id] = 'done';

  try {
    await setDoc(doc(db, 'users', user.uid), {
      pythonPath: progress,
      pathXP: Object.keys(progress).length * 10,
    }, { merge: true });
  } catch(e) { console.warn(e); }

  // Animate XP (only show first-time completion toast as a fresh reward)
  spawnXP(xp);
  ppToast(alreadyDone
    ? `+${xp} XP — қайталау аяқталды! 🔄`
    : `+${xp} XP — «${lesson.title}» аяқталды! 🎉`);

  // Re-render path
  const roadmapEl = document.getElementById('pythonRoadmap');
  if (roadmapEl) {
    const flat = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));
    const unlocked = buildUnlocked(flat, completed);
    roadmapEl.innerHTML = '';
    renderPath(roadmapEl, completed);
    attachHandlers(roadmapEl, db, user, completed, progress);
  }
}

// ═══════════════════════════════════════════════════════════
//  LESSON PLAYER — толыққанды интерактивті тапсырмалар (Duolingo)
// ═══════════════════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareExercise(ex) {
  const e = JSON.parse(JSON.stringify(ex));
  if ((e.type === 'mcq' || e.type === 'output') && Array.isArray(e.o)) {
    const correctValue = e.o[e.c];
    const shuffled = shuffle(e.o);
    e.o = shuffled;
    e.c = shuffled.indexOf(correctValue);
  }
  return e;
}

function getExercisesForLesson(lesson) {
  let pool;
  if (lesson.type === 'checkpoint') {
    const unitLessons = (lesson.unit?.lessons || []).filter(l => EXERCISES[l.id]);
    pool = shuffle(unitLessons.flatMap(l => EXERCISES[l.id]));
    pool = pool.slice(0, Math.max(1, Math.min(6, pool.length)));
  } else if (lesson.type === 'boss') {
    pool = shuffle(Object.values(EXERCISES).flat());
    pool = pool.slice(0, Math.max(1, Math.min(10, pool.length)));
  } else {
    pool = EXERCISES[lesson.id];
  }
  if (!pool || !pool.length) {
    pool = [TF(`«${lesson.title}» тақырыбын меңгердің бе?`, true, 'Жалғастыру үшін жауап бер!')];
  }
  return pool.map(prepareExercise);
}

function openLessonPlayer(lesson, isDone, db, user, completed, progress, container) {
  document.getElementById('ppPlayer')?.remove();

  const exercises = getExercisesForLesson(lesson);
  const unitColor = lesson.unit?.color || '#58cc02';
  const unitDark  = lesson.unit?.darkColor || '#46a302';
  let idx = 0, hearts = 5, correctCount = 0, mistakes = 0, answered = false, selected = null;

  const ov = document.createElement('div');
  ov.id = 'ppPlayer';
  ov.className = 'pp-player';
  ov.innerHTML = `
    <div class="pp-player-head">
      <button class="pp-player-close" id="ppPlayerClose" aria-label="Жабу">✕</button>
      <div class="pp-player-bar"><div class="pp-player-bar-fill" id="ppBarFill" style="background:${unitColor}"></div></div>
      <div class="pp-player-hearts" id="ppHeartsBox"></div>
    </div>
    <div class="pp-player-body" id="ppPlayerBody"></div>
    <div class="pp-player-foot" id="ppPlayerFoot"></div>
  `;
  document.body.appendChild(ov);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => ov.classList.add('pp-player-show'));

  function closePlayer() {
    document.body.style.overflow = prevOverflow;
    ov.classList.remove('pp-player-show');
    setTimeout(() => ov.remove(), 220);
  }
  ov.querySelector('#ppPlayerClose').onclick = () => {
    if (idx > 0 && idx < exercises.length) {
      if (!confirm('Сабақтан шығасың ба? Прогресс сақталмайды.')) return;
    }
    closePlayer();
  };

  function updateBar() {
    ov.querySelector('#ppBarFill').style.width = `${Math.round((idx/exercises.length)*100)}%`;
    const left = Math.max(hearts, 0);
    ov.querySelector('#ppHeartsBox').textContent = '❤️'.repeat(left) + '🖤'.repeat(5-left);
  }

  function renderExercise() {
    answered = false; selected = null;
    updateBar();
    const ex = exercises[idx];
    const body = ov.querySelector('#ppPlayerBody');
    const foot = ov.querySelector('#ppPlayerFoot');
    body.classList.remove('pp-shake');
    foot.className = 'pp-player-foot';

    let html = '';
    if (ex.type === 'mcq' || ex.type === 'tf' || ex.type === 'output') {
      const opts = ex.type === 'tf' ? ['Дұрыс','Бұрыс'] : ex.o;
      html += `<div class="pp-ex-kicker">${ex.type==='output' ? '🖥️ Код нәтижесі' : '🤔 Дұрыс жауапты таңда'}</div>`;
      if (ex.type === 'output') html += `<pre class="pp-ex-code">${esc(ex.code)}</pre>`;
      html += `<div class="pp-ex-q">${esc(ex.q).replace(/\n/g,'<br>')}</div>`;
      html += `<div class="pp-ex-options">`;
      opts.forEach((o, i) => { html += `<button class="pp-ex-opt" data-i="${i}">${esc(o)}</button>`; });
      html += `</div>`;
    } else if (ex.type === 'fill') {
      html += `<div class="pp-ex-kicker">✍️ Бос орынды толтыр</div>`;
      if (ex.code) html += `<pre class="pp-ex-code">${esc(ex.code)}</pre>`;
      html += `<div class="pp-ex-q">${esc(ex.q)}</div>`;
      html += `<input type="text" class="pp-ex-input" id="ppFillInput" placeholder="Жауабыңды жаз..." autocomplete="off" autocapitalize="off" spellcheck="false">`;
    }
    body.innerHTML = html;

    if (ex.type === 'fill') {
      const input = body.querySelector('#ppFillInput');
      setTimeout(() => input.focus(), 50);
      input.addEventListener('input', () => {
        selected = input.value;
        foot.querySelector('#ppCheckBtn').disabled = !selected.trim();
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter' && selected?.trim()) checkAnswer(); });
    } else {
      body.querySelectorAll('.pp-ex-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          body.querySelectorAll('.pp-ex-opt').forEach(b => b.classList.remove('pp-ex-opt-sel'));
          btn.classList.add('pp-ex-opt-sel');
          selected = ex.type === 'tf' ? (Number(btn.dataset.i) === 0) : Number(btn.dataset.i);
          foot.querySelector('#ppCheckBtn').disabled = false;
        });
      });
    }

    foot.innerHTML = `<button class="pp-mbtn pp-mbtn-main" id="ppCheckBtn" disabled style="background:${unitColor};box-shadow:0 4px 0 ${unitDark}">Тексеру</button>`;
    foot.querySelector('#ppCheckBtn').addEventListener('click', checkAnswer);
  }

  function checkAnswer() {
    if (answered) return;
    answered = true;
    const ex = exercises[idx];
    const body = ov.querySelector('#ppPlayerBody');
    const foot = ov.querySelector('#ppPlayerFoot');
    let correct;

    if (ex.type === 'fill') {
      const norm = s => String(s).trim().toLowerCase();
      correct = ex.a.some(a => norm(a) === norm(selected));
      const inp = body.querySelector('#ppFillInput');
      inp.disabled = true;
      inp.classList.add(correct ? 'pp-ex-input-ok' : 'pp-ex-input-bad');
    } else {
      correct = selected === ex.c;
      body.querySelectorAll('.pp-ex-opt').forEach((b, i) => {
        b.classList.add('pp-ex-opt-disabled');
        if (i === ex.c) b.classList.add('pp-ex-opt-correct');
        else if (b.classList.contains('pp-ex-opt-sel')) b.classList.add('pp-ex-opt-wrong');
      });
    }

    if (correct) {
      correctCount++;
      foot.className = 'pp-player-foot pp-foot-ok';
      foot.innerHTML = `
        <div class="pp-ex-feedback"><span>✅ Дұрыс!</span>${ex.e ? `<p>${esc(ex.e)}</p>` : ''}</div>
        <button class="pp-mbtn pp-mbtn-main" id="ppNextBtn" style="background:#58cc02;box-shadow:0 4px 0 #46a302">Жалғастыру</button>`;
    } else {
      mistakes++; hearts--;
      foot.className = 'pp-player-foot pp-foot-bad';
      const answerText = ex.type === 'fill' ? ex.a[0] : (ex.type === 'tf' ? (ex.c ? 'Дұрыс' : 'Бұрыс') : ex.o[ex.c]);
      foot.innerHTML = `
        <div class="pp-ex-feedback"><span>❌ Дұрыс емес</span><p>Дұрыс жауап: <b>${esc(answerText)}</b>${ex.e ? ` — ${esc(ex.e)}` : ''}</p></div>
        <button class="pp-mbtn pp-mbtn-main" id="ppNextBtn" style="background:#ff4b4b;box-shadow:0 4px 0 #b83333">Жалғастыру</button>`;
      body.classList.add('pp-shake');
      updateBar();
    }

    foot.querySelector('#ppNextBtn').addEventListener('click', () => {
      if (hearts <= 0) { showFail(); return; }
      idx++;
      if (idx >= exercises.length) showComplete();
      else renderExercise();
    });
  }

  function showFail() {
    const body = ov.querySelector('#ppPlayerBody');
    const foot = ov.querySelector('#ppPlayerFoot');
    foot.className = 'pp-player-foot';
    body.innerHTML = `
      <div class="pp-ex-result">
        <div class="pp-ex-result-emoji">💔</div>
        <div class="pp-ex-result-title">Жүректер бітті!</div>
        <div class="pp-ex-result-sub">Қайталап көр, бәрі жақсы болады 💪</div>
      </div>`;
    foot.innerHTML = `
      <button class="pp-mbtn pp-mbtn-main" id="ppRetryBtn" style="background:${unitColor};box-shadow:0 4px 0 ${unitDark}">🔄 Қайталау</button>
      <button class="pp-mbtn pp-mbtn-outline" id="ppQuitBtn">Шығу</button>`;
    foot.querySelector('#ppRetryBtn').onclick = () => {
      idx = 0; hearts = 5; correctCount = 0; mistakes = 0;
      renderExercise();
    };
    foot.querySelector('#ppQuitBtn').onclick = closePlayer;
  }

  function showComplete() {
    const body = ov.querySelector('#ppPlayerBody');
    const foot = ov.querySelector('#ppPlayerFoot');
    const perfect = mistakes === 0;
    const earnedXP = lesson.xp + (perfect ? Math.round(lesson.xp * 0.5) : 0);
    ov.querySelector('#ppBarFill').style.width = '100%';

    body.innerHTML = `
      <div class="pp-ex-result">
        <div class="pp-ex-result-emoji">${perfect ? '🌟' : '🎉'}</div>
        <div class="pp-ex-result-title">${perfect ? 'Тамаша! Қателіксіз!' : 'Сабақ аяқталды!'}</div>
        <div class="pp-ex-result-stats">
          <div class="pp-ex-stat"><span class="pp-ex-stat-n">${correctCount}/${exercises.length}</span><span class="pp-ex-stat-l">Дұрыс</span></div>
          <div class="pp-ex-stat"><span class="pp-ex-stat-n">${Math.max(hearts,0)}</span><span class="pp-ex-stat-l">Жүрек қалды</span></div>
          <div class="pp-ex-stat pp-ex-stat-xp"><span class="pp-ex-stat-n">+${earnedXP}</span><span class="pp-ex-stat-l">XP</span></div>
        </div>
      </div>`;
    foot.className = 'pp-player-foot';
    foot.innerHTML = `<button class="pp-mbtn pp-mbtn-main" id="ppDoneBtn" style="background:#58cc02;box-shadow:0 4px 0 #46a302">Жалғастыру →</button>`;
    foot.querySelector('#ppDoneBtn').onclick = async () => {
      closePlayer();
      await markDone(lesson, db, user, completed, progress, container, earnedXP);
    };
  }

  renderExercise();
}

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function navigate(lesson) {
  if (lesson.type === 'quiz' || lesson.type === 'boss') {
    document.querySelector('.nav-item[data-target="view-quizzes"]')?.click();
    if (lesson.type === 'boss')
      setTimeout(() => document.querySelector('[data-quiz-panel="qp-bosses"]')?.click(), 300);
  } else if (lesson.type === 'lesson' || lesson.type === 'task') {
    document.querySelector('.nav-item[data-target="view-story"]')?.click();
  }
}

// ═══════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════
function spawnXP(amount) {
  const el = document.createElement('div');
  el.className = 'pp-xp-pop';
  el.textContent = `+${amount} XP`;
  el.style.cssText = `left:${window.innerWidth/2 - 30 + (Math.random()-0.5)*60}px;top:${window.innerHeight*0.4}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function ppToast(msg, err = false) {
  let t = document.getElementById('pp-toast');
  if (!t) { t = document.createElement('div'); t.id = 'pp-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `pp-toast${err ? ' pp-toast-err' : ''}`;
  t.classList.add('pp-toast-show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('pp-toast-show'), 3200);
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('pp-styles')) return;
  const s = document.createElement('style');
  s.id = 'pp-styles';
  s.textContent = `
/* ── LOADING ── */
.pp-loading{display:flex;align-items:center;justify-content:center;gap:14px;padding:80px 24px;color:var(--text3);font-size:14px;font-family:var(--mono)}
.pp-spinner{width:24px;height:24px;border-radius:50%;border:3px solid var(--bg3);border-top-color:#58cc02;animation:pp-spin .7s linear infinite;flex-shrink:0}
@keyframes pp-spin{to{transform:rotate(360deg)}}

/* ── HEADER ── */
.pp-header{display:flex;align-items:center;justify-content:center;gap:24px;padding:20px 16px 28px;border-bottom:1px solid var(--border);flex-wrap:wrap;margin-bottom:8px}
.pp-hdr-item{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:72px}
.pp-hdr-lbl{font-size:10px;font-family:var(--mono);color:var(--text3);text-transform:uppercase;letter-spacing:.08em}
.pp-hdr-big{font-size:24px;font-weight:900;font-family:var(--mono);line-height:1}
.pp-hdr-green{color:#58cc02;text-shadow:0 0 16px rgba(88,204,2,.25)}
.pp-hdr-blue{color:#1cb0f6}
.pp-hdr-streak{display:flex;align-items:center;gap:4px}
.pp-fire-icon{font-size:32px;line-height:1;filter:drop-shadow(0 2px 8px rgba(255,150,0,.4));animation:pp-fire 1.8s ease-in-out infinite}
@keyframes pp-fire{0%,100%{transform:scale(1) rotate(-4deg)}50%{transform:scale(1.12) rotate(4deg)}}
.pp-xp-ring{position:relative;width:64px;height:64px;flex-shrink:0}
.pp-ring-lv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:var(--text);font-family:var(--mono)}
.pp-hearts{font-size:20px;letter-spacing:1px;line-height:1}

/* ── UNIT BANNER ── */
.pp-unit-banner{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:linear-gradient(135deg,color-mix(in srgb,var(--uc) 12%,var(--bg2)),var(--bg2));
  border:2px solid color-mix(in srgb,var(--uc) 35%,transparent);
  border-radius:20px;padding:18px 22px;margin:28px 0 4px;
  transition:.2s;
}
.pp-unit-banner.pp-unit-locked{opacity:.45;filter:grayscale(.6)}
.pp-unit-left{display:flex;align-items:center;gap:14px}
.pp-unit-icon{font-size:38px;line-height:1;filter:drop-shadow(0 2px 8px rgba(0,0,0,.2))}
.pp-unit-section{font-family:var(--mono);font-size:10px;color:var(--uc,#58cc02);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
.pp-unit-title{font-size:17px;font-weight:900;color:var(--text);margin-bottom:2px}
.pp-unit-sub{font-size:12px;color:var(--text3)}
.pp-unit-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.pp-unit-prog{display:flex;align-items:center;gap:10px}
.pp-unit-prog-bar{width:120px;height:8px;background:var(--bg4);border-radius:99px;overflow:hidden}
.pp-unit-prog-fill{height:100%;background:var(--uc,#58cc02);border-radius:99px;transition:width .6s}
.pp-unit-prog-txt{font-family:var(--mono);font-size:11px;color:var(--text3);white-space:nowrap}
.pp-unit-done-badge{background:rgba(88,204,2,.15);color:#58cc02;border:1px solid rgba(88,204,2,.3);border-radius:99px;padding:4px 12px;font-size:11px;font-weight:800}
.pp-unit-lock{font-size:20px}

/* ── TRACK / NODES ── */
.pp-track{display:flex;flex-direction:column;align-items:flex-start;padding:8px 0 4px;position:relative}

.pp-node-wrap{display:flex;flex-direction:column;align-items:center;position:relative;transition:margin .3s cubic-bezier(.16,1,.3,1)}

/* START arrow */
.pp-start-arrow{display:flex;flex-direction:column;align-items:center;margin-bottom:4px}
.pp-start-label{
  background:var(--nc,#58cc02);color:#fff;font-size:11px;font-weight:900;
  padding:4px 14px;border-radius:99px;font-family:var(--mono);letter-spacing:.05em;
  animation:pp-bounce .9s ease-in-out infinite;
}
@keyframes pp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.pp-start-chevron{font-size:14px;color:var(--nc,#58cc02);margin-top:2px;animation:pp-bounce .9s ease-in-out infinite .1s}

/* Node */
.pp-node{
  display:flex;flex-direction:column;align-items:center;gap:6px;
  cursor:pointer;position:relative;user-select:none;
  transition:transform .15s cubic-bezier(.16,1,.3,1);
}
.pp-node:hover:not(.pp-n-locked) .pp-node-circle{transform:scale(1.08)}
.pp-node:active:not(.pp-n-locked) .pp-node-circle{transform:scale(.95)}

/* Circle — Duolingo exact */
.pp-node-circle{
  width:72px;height:72px;border-radius:50%;position:relative;
  display:flex;align-items:center;justify-content:center;
  background:var(--nc,#58cc02);
  box-shadow:0 6px 0 var(--nd,#46a302);
  transition:all .15s cubic-bezier(.16,1,.3,1);
  border:3px solid rgba(255,255,255,.15);
}
.pp-n-done .pp-node-circle{
  background:var(--nc,#58cc02);
  box-shadow:0 4px 0 var(--nd,#46a302);
}
.pp-n-current .pp-node-circle{
  background:var(--nc,#58cc02);
  box-shadow:0 6px 0 var(--nd,#46a302),0 0 0 6px color-mix(in srgb,var(--nc,#58cc02) 20%,transparent);
}
.pp-n-locked .pp-node-circle{
  background:var(--bg3);border-color:var(--border2);
  box-shadow:0 4px 0 var(--border);cursor:not-allowed;
}
.pp-n-boss .pp-node-circle{background:#ff4b4b;box-shadow:0 6px 0 #b83333;border-color:rgba(255,255,255,.2)}
.pp-n-check .pp-node-circle{background:#ffd900;box-shadow:0 6px 0 #b89c00;border-color:rgba(255,255,255,.25)}
.pp-n-locked{opacity:.55}

.pp-node-emoji{font-size:30px;line-height:1;z-index:1}
.pp-n-done .pp-node-emoji{font-size:26px}
.pp-n-locked .pp-node-emoji{font-size:26px;filter:grayscale(1) opacity(.6)}

/* Ripple ring on current */
.pp-node-ring{
  position:absolute;inset:-8px;border-radius:50%;
  border:3px solid var(--nc,#58cc02);opacity:.5;
  animation:pp-ripple 2s ease-out infinite;
}
@keyframes pp-ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.5);opacity:0}}

/* Labels */
.pp-node-name{
  font-size:11px;font-weight:700;color:var(--text2);
  text-align:center;max-width:80px;line-height:1.3;
}
.pp-n-locked .pp-node-name{color:var(--text3)}
.pp-node-xp{font-size:10px;font-family:var(--mono);color:#58cc02;font-weight:700}

/* Connector */
.pp-connector{
  width:4px;height:32px;background:var(--border2);border-radius:99px;margin:3px auto;
  transition:background .4s;
}
.pp-conn-done{background:rgba(88,204,2,.45)}

/* ── FINISH ── */
.pp-finish{display:flex;justify-content:center;padding:32px 0 48px}
.pp-finish-box{
  background:linear-gradient(135deg,rgba(255,217,0,.08),rgba(88,204,2,.06));
  border:2px dashed rgba(255,217,0,.4);border-radius:24px;
  padding:32px 40px;text-align:center;max-width:320px;
}
.pp-finish-trophy{font-size:60px;margin-bottom:12px;display:block;
  filter:drop-shadow(0 4px 16px rgba(255,217,0,.4));
  animation:pp-trophy 2.2s ease-in-out infinite}
@keyframes pp-trophy{0%,100%{transform:scale(1) rotate(-4deg)}50%{transform:scale(1.08) rotate(4deg)}}
.pp-finish-title{font-size:20px;font-weight:900;color:#ffd900;margin-bottom:6px}
.pp-finish-sub{font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.5}
.pp-finish-gems{font-size:24px;letter-spacing:6px}

/* ── MODAL ── */
.pp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(10px);
  display:flex;align-items:flex-end;justify-content:center;
  z-index:3000;opacity:0;transition:opacity .22s;pointer-events:none}
.pp-overlay.pp-overlay-show{opacity:1;pointer-events:all}
@media(min-width:600px){.pp-overlay{align-items:center}}
.pp-modal{
  background:var(--bg2);border-radius:24px 24px 0 0;
  width:100%;max-width:440px;overflow:hidden;
  transform:translateY(40px);transition:transform .26s cubic-bezier(.16,1,.3,1);
  position:relative;
}
@media(min-width:600px){.pp-modal{border-radius:24px;transform:scale(.93) translateY(12px)}}
.pp-overlay.pp-overlay-show .pp-modal{transform:translateY(0)}
@media(min-width:600px){.pp-overlay.pp-overlay-show .pp-modal{transform:scale(1) translateY(0)}}
.pp-modal-x{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.1);border:none;
  color:var(--text2);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:13px;
  display:flex;align-items:center;justify-content:center;transition:.15s;z-index:1}
.pp-modal-x:hover{background:rgba(255,255,255,.2);color:var(--text)}
.pp-modal-top{padding:28px 24px 20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.pp-modal-emoji{font-size:72px;line-height:1;filter:drop-shadow(0 4px 16px rgba(0,0,0,.2))}
.pp-modal-badge{font-size:11px;font-weight:800;padding:4px 14px;border-radius:99px;font-family:var(--mono);letter-spacing:.05em}
.pp-modal-body{padding:0 24px 8px;text-align:center}
.pp-modal-title{font-size:20px;font-weight:900;margin-bottom:8px;line-height:1.25}
.pp-modal-desc{font-size:13px;color:var(--text3);line-height:1.65;margin-bottom:12px}
.pp-modal-topics{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:12px}
.pp-pill{background:var(--bg3);border:1px solid var(--border2);border-radius:99px;padding:3px 11px;font-size:11px;font-family:var(--mono);color:var(--text3)}
.pp-modal-xp{font-family:var(--mono);font-size:18px;font-weight:900;color:#58cc02;margin-bottom:8px}
.pp-modal-done{background:rgba(88,204,2,.1);border:1px solid rgba(88,204,2,.25);color:#58cc02;
  border-radius:99px;padding:5px 16px;font-size:13px;font-weight:700;display:inline-block;margin-bottom:4px}
.pp-modal-footer{padding:16px 24px 28px;display:flex;flex-direction:column;gap:8px}
.pp-mbtn{width:100%;padding:15px;border-radius:14px;font-family:var(--font);font-size:15px;font-weight:900;cursor:pointer;border:none;transition:.15s}
.pp-mbtn-main{color:#fff;border-bottom:4px solid var(--nd,#46a302)}
.pp-mbtn-main:hover{filter:brightness(1.08);transform:translateY(-2px)}
.pp-mbtn-main:active{transform:translateY(2px);box-shadow:none}
.pp-mbtn-outline{background:var(--bg3);border:2px solid var(--border2);color:var(--text2)}
.pp-mbtn-outline:hover{border-color:var(--border3);color:var(--text)}

/* ── TOAST ── */
.pp-toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%) translateY(12px);
  background:#58cc02;color:#fff;font-weight:900;font-family:var(--mono);font-size:13px;
  padding:11px 26px;border-radius:99px;z-index:9999;opacity:0;transition:.28s;
  pointer-events:none;white-space:nowrap;box-shadow:0 6px 20px rgba(88,204,2,.35)}
.pp-toast.pp-toast-show{opacity:1;transform:translateX(-50%) translateY(0)}
.pp-toast.pp-toast-err{background:#ff4b4b;box-shadow:0 6px 20px rgba(255,75,75,.35)}

/* ── XP POP ── */
.pp-xp-pop{position:fixed;pointer-events:none;font-family:var(--mono);font-size:24px;font-weight:900;
  color:#58cc02;text-shadow:0 0 20px rgba(88,204,2,.6);z-index:9999;
  animation:pp-xp-fly 1.5s ease-out forwards}
@keyframes pp-xp-fly{0%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-90px) scale(1.35)}}

/* ── SHAKE ── */
.pp-shake{animation:pp-shake .42s ease both}
@keyframes pp-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}

/* ══════════════════════════════════════════════════════
   LESSON PLAYER — толыққанды Duolingo-стиль тапсырмалар
   ══════════════════════════════════════════════════════ */
.pp-player{
  position:fixed;inset:0;background:var(--bg1,var(--bg2));z-index:4000;
  display:flex;flex-direction:column;opacity:0;transform:translateY(16px);
  transition:opacity .22s,transform .22s;
}
.pp-player.pp-player-show{opacity:1;transform:translateY(0)}

.pp-player-head{
  display:flex;align-items:center;gap:12px;
  padding:max(14px,env(safe-area-inset-top)) 16px 12px;flex-shrink:0;
}
.pp-player-close{
  background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;
  width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;flex-shrink:0;transition:.15s;
}
.pp-player-close:hover{background:var(--bg3);color:var(--text)}
.pp-player-bar{flex:1;height:14px;background:var(--bg4);border-radius:99px;overflow:hidden}
.pp-player-bar-fill{height:100%;border-radius:99px;transition:width .35s cubic-bezier(.16,1,.3,1);width:0}
.pp-player-hearts{font-size:16px;letter-spacing:1px;flex-shrink:0;white-space:nowrap}

.pp-player-body{
  flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:8px 20px 32px;max-width:560px;margin:0 auto;width:100%;box-sizing:border-box;
}
.pp-ex-kicker{font-size:12px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 16px;font-family:var(--mono)}
.pp-ex-q{font-size:19px;font-weight:800;color:var(--text);line-height:1.45;margin-bottom:20px}
.pp-ex-code{
  background:var(--bg3);border:1px solid var(--border2);border-radius:14px;
  padding:16px 18px;font-family:var(--mono);font-size:13.5px;line-height:1.6;
  color:var(--text);overflow-x:auto;margin-bottom:16px;white-space:pre-wrap;word-break:break-word;
}
.pp-ex-options{display:flex;flex-direction:column;gap:10px}
.pp-ex-opt{
  text-align:left;padding:15px 18px;border-radius:14px;border:2px solid var(--border2);
  background:var(--bg2);color:var(--text);font-family:var(--font);font-size:15px;font-weight:600;
  cursor:pointer;transition:.12s;-webkit-tap-highlight-color:transparent;
}
.pp-ex-opt:hover:not(.pp-ex-opt-disabled){border-color:var(--border3);background:var(--bg3)}
.pp-ex-opt-sel{border-color:#1cb0f6;background:rgba(28,176,246,.1)}
.pp-ex-opt-disabled{cursor:default}
.pp-ex-opt-correct{border-color:#58cc02;background:rgba(88,204,2,.12);color:#58cc02}
.pp-ex-opt-wrong{border-color:#ff4b4b;background:rgba(255,75,75,.12);color:#ff4b4b}
.pp-ex-input{
  width:100%;padding:15px 18px;border-radius:14px;border:2px solid var(--border2);
  background:var(--bg2);color:var(--text);font-family:var(--mono);font-size:15px;
  box-sizing:border-box;outline:none;transition:.12s;
}
.pp-ex-input:focus{border-color:#1cb0f6}
.pp-ex-input-ok{border-color:#58cc02;background:rgba(88,204,2,.08)}
.pp-ex-input-bad{border-color:#ff4b4b;background:rgba(255,75,75,.08)}

.pp-player-foot{
  flex-shrink:0;padding:14px 20px max(20px,env(safe-area-inset-bottom));border-top:1px solid var(--border);
  max-width:560px;margin:0 auto;width:100%;box-sizing:border-box;
}
.pp-foot-ok{background:rgba(88,204,2,.08)}
.pp-foot-bad{background:rgba(255,75,75,.08)}
.pp-ex-feedback{margin-bottom:12px;font-size:14px}
.pp-ex-feedback span{font-weight:900;font-size:16px;display:block;margin-bottom:4px}
.pp-foot-ok .pp-ex-feedback span{color:#58cc02}
.pp-foot-bad .pp-ex-feedback span{color:#ff4b4b}
.pp-ex-feedback p{color:var(--text3);margin:0;line-height:1.5}
#ppCheckBtn:disabled{opacity:.4;cursor:not-allowed}

.pp-ex-result{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 12px 24px}
.pp-ex-result-emoji{font-size:64px;margin-bottom:14px;animation:pp-trophy 2.2s ease-in-out infinite}
.pp-ex-result-title{font-size:22px;font-weight:900;color:var(--text);margin-bottom:8px}
.pp-ex-result-sub{font-size:13px;color:var(--text3);margin-bottom:14px}
.pp-ex-result-stats{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:8px}
.pp-ex-stat{background:var(--bg3);border:1px solid var(--border2);border-radius:16px;padding:14px 22px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:84px}
.pp-ex-stat-n{font-size:20px;font-weight:900;font-family:var(--mono);color:var(--text)}
.pp-ex-stat-l{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.pp-ex-stat-xp .pp-ex-stat-n{color:#ffd900}

@media(min-width:700px){
  .pp-player-body{padding-top:28px}
  .pp-ex-q{font-size:21px}
  .pp-ex-opt{padding:16px 20px}
}
@media(max-width:420px){
  .pp-ex-q{font-size:17px}
  .pp-player-head{padding-left:12px;padding-right:12px;gap:10px}
  .pp-ex-opt{padding:13px 14px;font-size:14px}
  .pp-ex-code{font-size:12.5px;padding:13px 14px}
  .pp-player-body{padding-left:16px;padding-right:16px}
  .pp-player-foot{padding-left:16px;padding-right:16px}
}
`;
  document.head.appendChild(s);
}