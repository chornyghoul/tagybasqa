
import {
    doc, getDoc, updateDoc, setDoc, increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let _db = null, _user = null;

export async function initPythonPath(user, db) {
    _db = db; _user = user;
    injectStyles();
    patchPageHTML();
    await renderPath();
    await renderPet();
}

const PETS = [
    { level:1, name:"Питончик",        emoji:"🥚",    rarity:"Обычный",     xp:0    },
    { level:2, name:"Малыш Пит",       emoji:"🐣",    rarity:"Обычный",     xp:80   },
    { level:3, name:"Пит",             emoji:"🐍",    rarity:"Обычный",     xp:220  },
    { level:4, name:"Питон Юный",      emoji:"🦎",    rarity:"Редкий",      xp:450  },
    { level:5, name:"Питон Боевой",    emoji:"🐲",    rarity:"Редкий",      xp:750  },
    { level:6, name:"Питон Эпик",      emoji:"🔥🐍",  rarity:"Эпический",   xp:1150 },
    { level:7, name:"Питон Легенда",   emoji:"⚡🐉",  rarity:"Легендарный", xp:1700 },
    { level:8, name:"Питон Богов",     emoji:"✨🐉✨", rarity:"Мифический",  xp:2500 },
];
const RCOL = { "Обычный":"#9ca3af","Редкий":"#60a5fa","Эпический":"#c084fc","Легендарный":"#fbbf24","Мифический":"#f43f5e" };
const petStage=xp=>{let s=PETS[0];for(const p of PETS)if(xp>=p.xp)s=p;return s;};
const petNext=xp=>{const i=PETS.indexOf(petStage(xp));return PETS[i+1]||null;};
const petPct=xp=>{const s=petStage(xp),n=petNext(xp);if(!n)return 100;return Math.min(100,Math.round(((xp-s.xp)/(n.xp-s.xp))*100));};


const MODULES = [
  { id:"m01",title:"Основы Python",emoji:"🐣",color:"#58cc02",xp:80,desc:"Переменные, типы, print",nodes:[
    {id:"m01n1",kind:"lesson",title:"Что такое Python?",type:"theory",content:"Python — язык с понятным синтаксисом, создан Гвидо ван Россумом в 1991 г.\n```print('Привет, мир!')```\nПрименяется в веб, data science, AI, автоматизации."},
    {id:"m01n2",kind:"quiz",title:"Python: первый квиз",questions:[
      {q:"Кто создал Python?",opts:["Билл Гейтс","Гвидо ван Россум","Линус Торвальдс","Деннис Ритчи"],ans:1,hint:"Гвидо начал работу над Python в конце 1980-х"},
      {q:"Python — это язык...",opts:["Компилируемый","Интерпретируемый","Ассемблерный","Машинный"],ans:1,hint:"Код выполняется строка за строкой интерпретатором"},
      {q:"Расширение файлов Python?",opts:[".java",".py",".js",".cpp"],ans:1,hint:"Файлы Python имеют расширение .py"},
    ]},
    {id:"m01n3",kind:"lesson",title:"Переменные и типы",type:"theory",content:"Переменная создаётся присваиванием:\n```x = 10          # int\nname = 'Python'  # str\npi = 3.14        # float\nflag = True      # bool```\nТип определяется автоматически. `type(x)` — проверить тип."},
    {id:"m01n4",kind:"quiz",title:"Типы данных",questions:[
      {q:"Тип значения 42?",opts:["str","int","float","bool"],ans:1,hint:"Целые числа — int"},
      {q:"Тип значения 3.14?",opts:["int","double","float","num"],ans:2,hint:"Числа с точкой — float"},
      {q:"Тип значения True?",opts:["bool","int","str","flag"],ans:0,hint:"True и False — тип bool"},
      {q:"Правильное имя переменной?",opts:["2name","my-var","_count","class"],ans:2,hint:"Начинается с буквы или _, без дефиса, не ключевое слово"},
    ]},
  ]},
  { id:"m02",title:"Строки",emoji:"📝",color:"#1cb0f6",xp:90,desc:"Срезы, методы, f-строки",nodes:[
    {id:"m02n1",kind:"lesson",title:"Создание и индексы",type:"theory",content:"```s = 'Python'\nprint(s[0])    # P\nprint(s[-1])   # n\nprint(s[1:4])  # yth\nprint(len(s))  # 6```\nИндексация с нуля. Отрицательный индекс — с конца."},
    {id:"m02n2",kind:"quiz",title:"Индексы строк",questions:[
      {q:"s = 'Python'\nЧто вернёт s[0]?",opts:["P","y","n","Error"],ans:0,hint:"Индексация с нуля"},
      {q:"Что вернёт len('hello')?",opts:["4","5","6","hello"],ans:1,hint:"len считает символы"},
      {q:"s = 'Python'\nЧто вернёт s[-1]?",opts:["P","y","n","o"],ans:2,hint:"-1 — последний символ"},
    ]},
    {id:"m02n3",kind:"lesson",title:"Методы строк",type:"theory",content:"```s = 'привет мир'\nprint(s.upper())          # ПРИВЕТ МИР\nprint(s.capitalize())     # Привет мир\nprint(s.replace('мир','Python'))\nprint(s.split(' '))       # ['привет','мир']\nprint('  hi  '.strip())   # 'hi'```"},
    {id:"m02n4",kind:"quiz",title:"Методы строк",questions:[
      {q:"'hello'.upper() вернёт?",opts:["Hello","HELLO","hello","HeLLo"],ans:1,hint:"upper() — все символы заглавными"},
      {q:"'  hi  '.strip() вернёт?",opts:["'  hi  '","hi","' hi'","Error"],ans:1,hint:"strip убирает пробелы по краям"},
      {q:"Правильный f-string?",opts:["'Привет '+name","f'Привет {name}'","{name}+' Привет'","format(name)"],ans:1,hint:"f-строка: f'текст {переменная}'"},
      {q:"'abc'.replace('b','X')?",opts:["aXc","Xbc","abX","abc"],ans:0,hint:"replace заменяет все вхождения"},
    ]},
  ]},
  { id:"m03",title:"Условия",emoji:"🔀",color:"#ff9600",xp:100,desc:"if, elif, else, сравнения",nodes:[
    {id:"m03n1",kind:"lesson",title:"if / elif / else",type:"theory",content:"```if x > 0:\n    print('положительное')\nelif x == 0:\n    print('ноль')\nelse:\n    print('отрицательное')```\nОтступ 4 пробела — часть синтаксиса!\nОператоры: == != > < >= <="},
    {id:"m03n2",kind:"quiz",title:"Условия: тест 1",questions:[
      {q:"if 5 > 3:\n    print('да')\nelse:\n    print('нет')\nЧто выведет?",opts:["нет","да","True","5 > 3"],ans:1,hint:"5 > 3 — истина"},
      {q:"Что НЕ является оператором сравнения?",opts:["==","!=","=>",">="],ans:2,hint:"В Python >= , а не =>"},
      {q:"x = 5\nif x == 5:\n    print(x * 2)\nЧто выведет?",opts:["5","2","10","True"],ans:2,hint:"5 * 2 = 10"},
    ]},
    {id:"m03n3",kind:"lesson",title:"Логические операторы",type:"theory",content:"```x = 5\nif x > 0 and x < 10:\n    print('от 1 до 9')  # ✓\n\nif x < 0 or x > 3:\n    print('да')         # ✓\n\nif not x == 0:\n    print('не ноль')    # ✓```\nand — оба истины, or — хотя бы одно, not — отрицание"},
    {id:"m03n4",kind:"quiz",title:"Условия: тест 2",questions:[
      {q:"x = 0\nif x:\n    print('да')\nelse:\n    print('нет')\nЧто выведет?",opts:["да","нет","0","False"],ans:1,hint:"0 в булевом контексте — False"},
      {q:"True and False == ?",opts:["True","False","None","Error"],ans:1,hint:"and: оба должны быть True"},
      {q:"True or False == ?",opts:["True","False","None","Error"],ans:0,hint:"or: достаточно одного True"},
      {q:"not True == ?",opts:["True","False","None","not"],ans:1,hint:"not инвертирует значение"},
    ]},
  ]},
  { id:"m04",title:"Циклы",emoji:"🔁",color:"#ff4b4b",xp:110,desc:"for, while, break, continue",nodes:[
    {id:"m04n1",kind:"lesson",title:"Цикл for",type:"theory",content:"```for i in range(5):\n    print(i)     # 0 1 2 3 4\n\nfor char in 'Python':\n    print(char)\n\nfor i in range(2, 10, 2):\n    print(i)     # 2 4 6 8```\nrange(start, stop, step)"},
    {id:"m04n2",kind:"quiz",title:"Цикл for: тест",questions:[
      {q:"for i in range(3):\n    print(i)\nЧто выведет?",opts:["1 2 3","0 1 2","0 1 2 3","1 2"],ans:1,hint:"range(3) → 0, 1, 2"},
      {q:"range(1, 6) даёт?",opts:["0-5","1-6","1-5","0-6"],ans:2,hint:"range(start, stop) — stop не включается"},
    ]},
    {id:"m04n3",kind:"lesson",title:"Цикл while + break",type:"theory",content:"```n = 0\nwhile n < 5:\n    print(n)\n    n += 1\n\nwhile True:\n    x = int(input())\n    if x == 0:\n        break   # выход из цикла\n    elif x < 0:\n        continue  # пропустить итерацию\n    print(x)```"},
    {id:"m04n4",kind:"quiz",title:"while, break, continue",questions:[
      {q:"Что делает break?",opts:["Пропускает итерацию","Останавливает цикл","Перезапускает","Ничего"],ans:1,hint:"break выходит из цикла немедленно"},
      {q:"Что делает continue?",opts:["Пропускает итерацию","Останавливает цикл","Ничего","Выход из функции"],ans:0,hint:"continue переходит к следующей итерации"},
      {q:"n=3; while n>0: n-=1\nСколько раз выполнится тело?",opts:["2","3","4","бесконечно"],ans:1,hint:"n=3,2,1 — три итерации"},
    ]},
    {id:"m04n5",kind:"chest",title:"Сундук: Циклы",bonus:30},
  ]},
  { id:"m05",title:"Функции",emoji:"⚙️",color:"#ce82ff",xp:120,desc:"def, return, *args, lambda",nodes:[
    {id:"m05n1",kind:"lesson",title:"Определение функций",type:"theory",content:"```def greet(name):\n    return f'Привет, {name}!'\n\nprint(greet('Python'))  # Привет, Python!\n\ndef power(x, n=2):\n    return x ** n\n\nprint(power(3))     # 9\nprint(power(2, 3))  # 8```"},
    {id:"m05n2",kind:"quiz",title:"Функции: базовый тест",questions:[
      {q:"Ключевое слово для функции?",opts:["func","function","def","define"],ans:2,hint:"В Python — def"},
      {q:"Что вернёт функция без return?",opts:["0","False","None","Error"],ans:2,hint:"Неявно возвращается None"},
      {q:"def f(x, y=10):\n    return x+y\nprint(f(5))\nЧто выведет?",opts:["5","10","15","Error"],ans:2,hint:"y=10 по умолчанию, 5+10=15"},
      {q:"lambda x: x*2 — это?",opts:["Тип данных","Анонимная функция","Цикл","Класс"],ans:1,hint:"lambda — однострочная функция без имени"},
    ]},
    {id:"m05n3",kind:"lesson",title:"*args и **kwargs",type:"theory",content:"```def total(*nums):\n    return sum(nums)\n\nprint(total(1, 2, 3, 4))  # 10\n\ndef info(**data):\n    for k, v in data.items():\n        print(f'{k}: {v}')\n\ninfo(name='Python', year=1991)```"},
    {id:"m05n4",kind:"quiz",title:"Функции: продвинутый",questions:[
      {q:"(lambda x,y: x+y)(3,4) вернёт?",opts:["34","7","12","Error"],ans:1,hint:"3+4=7"},
      {q:"*args позволяет передать?",opts:["Только 1 аргумент","Любое кол-во аргументов","Только словарь","Ничего"],ans:1,hint:"* — произвольное кол-во позиционных аргументов"},
      {q:"**kwargs принимает?",opts:["Только числа","Именованные аргументы","Позиционные","Ничего"],ans:1,hint:"**kwargs — словарь именованных аргументов"},
    ]},
    {id:"m05n5",kind:"boss",title:"Босс: Функции"},
  ]},
  { id:"m06",title:"Списки и словари",emoji:"📋",color:"#ff9600",xp:115,desc:"list, dict, set, comprehension",nodes:[
    {id:"m06n1",kind:"lesson",title:"Списки",type:"theory",content:"```nums = [1, 2, 3, 4, 5]\nprint(nums[0])     # 1\nprint(nums[-1])    # 5\nprint(nums[1:3])   # [2, 3]\n\nnums.append(6)     # добавить в конец\nnums.insert(0, 0)  # вставить на позицию 0\npopped = nums.pop()  # удалить последний\nprint(sorted(nums))  # отсортированная копия```"},
    {id:"m06n2",kind:"quiz",title:"Списки: тест",questions:[
      {q:"[1,2,3].append(4) результат?",opts:["[4,1,2,3]","[1,2,3,4]","[1,2,3]","Error"],ans:1,hint:"append добавляет в конец"},
      {q:"[10,20,30][-1] вернёт?",opts:["10","20","30","-1"],ans:2,hint:"-1 — последний элемент"},
      {q:"[1,2,3,4,5][1:3] вернёт?",opts:["[1,2]","[2,3]","[3,4]","[1,2,3]"],ans:1,hint:"Срез [start:stop] — stop не включается"},
    ]},
    {id:"m06n3",kind:"lesson",title:"Словари и множества",type:"theory",content:"```d = {'name':'Python','year':1991}\nprint(d['name'])     # Python\nd['version'] = 3.11  # добавить ключ\n\nd.keys()    # ключи\nd.values()  # значения\nd.items()   # пары (k, v)\n\n# Множество — уникальные элементы\ns = {1, 2, 3, 2, 1}\nprint(s)  # {1, 2, 3}```"},
    {id:"m06n4",kind:"quiz",title:"Словари: тест",questions:[
      {q:"d={'a':1}\nd['b']=2\nprint(d)\nЧто выведет?",opts:["{'a':1}","{'b':2}","{'a':1,'b':2}","Error"],ans:2,hint:"d['b']=2 добавляет новый ключ"},
      {q:"Как получить все ключи словаря d?",opts:["d.keys()","d.index()","d.list()","keys(d)"],ans:0,hint:"Метод .keys() возвращает все ключи"},
      {q:"[x*2 for x in range(3)] вернёт?",opts:["[0,2,4]","[1,2,3]","[2,4,6]","[0,1,2]"],ans:0,hint:"0*2=0, 1*2=2, 2*2=4"},
      {q:"Что хранит set?",opts:["Пары ключ-значение","Уникальные элементы","Упорядоченные данные","Ничего"],ans:1,hint:"set — множество без дубликатов"},
    ]},
    {id:"m06n5",kind:"chest",title:"Сундук: Коллекции",bonus:40},
  ]},
  { id:"m07",title:"Файлы и исключения",emoji:"📁",color:"#1cb0f6",xp:125,desc:"open, try/except, with",nodes:[
    {id:"m07n1",kind:"lesson",title:"Работа с файлами",type:"theory",content:"```with open('file.txt', 'w') as f:\n    f.write('Привет!')\n\nwith open('file.txt', 'r') as f:\n    text = f.read()\n    print(text)\n\n# Режимы: r(чтение), w(запись), a(добавление)\n# with — автоматически закрывает файл```"},
    {id:"m07n2",kind:"quiz",title:"Файлы: тест",questions:[
      {q:"Режим 'w' при open?",opts:["Чтение","Запись (перезапись)","Добавление","Бинарный"],ans:1,hint:"w = write, перезаписывает файл"},
      {q:"Зачем нужен with?",opts:["Ускоряет код","Автоматически закрывает файл","Создаёт файл","Шифрует"],ans:1,hint:"with гарантирует закрытие даже при ошибке"},
      {q:"Режим 'a' при open?",opts:["Чтение","Запись","Добавление в конец","Архив"],ans:2,hint:"a = append, дописывает в конец"},
    ]},
    {id:"m07n3",kind:"lesson",title:"try / except",type:"theory",content:"```try:\n    x = int(input('Число: '))\n    result = 10 / x\nexcept ValueError:\n    print('Это не число!')\nexcept ZeroDivisionError:\n    print('Деление на ноль!')\nelse:\n    print(f'Результат: {result}')\nfinally:\n    print('Всегда выполняется')```"},
    {id:"m07n4",kind:"quiz",title:"Исключения: тест",questions:[
      {q:"Что делает блок finally?",opts:["При ошибке","Всегда","Только без ошибки","Никогда"],ans:1,hint:"finally выполняется в любом случае"},
      {q:"int('abc') вызовет?",opts:["TypeError","ValueError","NameError","IndexError"],ans:1,hint:"Преобразование строки в int — ValueError"},
      {q:"[1,2][5] вызовет?",opts:["TypeError","ValueError","IndexError","KeyError"],ans:2,hint:"Выход за пределы — IndexError"},
      {q:"Блок else в try/except выполняется?",opts:["При ошибке","Всегда","Только без ошибки","Никогда"],ans:2,hint:"else — когда исключений не было"},
    ]},
  ]},
  { id:"m08",title:"ООП: Основы",emoji:"🏗️",color:"#ff4b4b",xp:140,desc:"Классы, объекты, методы",nodes:[
    {id:"m08n1",kind:"lesson",title:"Классы и объекты",type:"theory",content:"```class Dog:\n    species = 'Canis familiaris'\n\n    def __init__(self, name, age):\n        self.name = name\n        self.age  = age\n\n    def bark(self):\n        return f'{self.name}: Гав!'\n\nrex = Dog('Рекс', 3)\nprint(rex.bark())   # Рекс: Гав!\nprint(rex.species)  # Canis familiaris```"},
    {id:"m08n2",kind:"quiz",title:"Классы: базовый",questions:[
      {q:"Что такое self?",opts:["Ключевое слово Python","Ссылка на экземпляр","Статическая переменная","Тип данных"],ans:1,hint:"self — ссылка на текущий объект"},
      {q:"Какой метод вызывается при Dog('Рекс')?",opts:["__create__","__new__","__init__","__start__"],ans:2,hint:"__init__ — конструктор"},
      {q:"class Cat: pass\nc = Cat()\ntype(c) вернёт?",opts:["class","Cat","object","None"],ans:1,hint:"type(c) возвращает класс объекта"},
    ]},
    {id:"m08n3",kind:"lesson",title:"Наследование",type:"theory",content:"```class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return 'Звук'\n\nclass Dog(Animal):\n    def speak(self):\n        return f'{self.name}: Гав!'\n\nclass Cat(Animal):\n    def speak(self):\n        return f'{self.name}: Мяу!'\n\nfor a in [Dog('Рекс'), Cat('Мурка')]:\n    print(a.speak())```"},
    {id:"m08n4",kind:"quiz",title:"Наследование: тест",questions:[
      {q:"Как объявить наследование?",opts:["class Child extends Parent:","class Child(Parent):","class Child inherits Parent:","Child -> Parent:"],ans:1,hint:"class Дочерний(Родитель):"},
      {q:"super().__init__() делает?",opts:["Удаляет объект","Вызывает конструктор родителя","Создаёт копию","Ничего"],ans:1,hint:"super() обращается к родительскому классу"},
      {q:"isinstance(Dog(), Animal) вернёт?",opts:["False","True","None","Error"],ans:1,hint:"Dog наследует Animal → True"},
      {q:"Переопределение метода родителя — это?",opts:["Инкапсуляция","Полиморфизм","Наследование","Абстракция"],ans:1,hint:"Разные объекты — разное поведение = полиморфизм"},
    ]},
    {id:"m08n5",kind:"boss",title:"Босс: ООП"},
  ]},
  { id:"m09",title:"Модули и пакеты",emoji:"📦",color:"#58cc02",xp:130,desc:"import, os, math, random",nodes:[
    {id:"m09n1",kind:"lesson",title:"Импорт модулей",type:"theory",content:"```import math\nprint(math.pi)          # 3.14159\nprint(math.sqrt(16))    # 4.0\n\nimport random\nprint(random.randint(1, 10))\n\nfrom os import path\nprint(path.exists('file.txt'))\n\nimport datetime\nnow = datetime.datetime.now()\nprint(now.year)```"},
    {id:"m09n2",kind:"quiz",title:"Модули: тест",questions:[
      {q:"math.sqrt(25) вернёт?",opts:["5","25","5.0","Error"],ans:2,hint:"sqrt возвращает float"},
      {q:"from X import Y означает?",opts:["Импорт всего X","Импорт Y из X","Создание X","Удаление Y"],ans:1,hint:"from X import Y — только нужный объект"},
      {q:"random.randint(1,6) вернёт?",opts:["Только 1","Только 6","Число от 1 до 6","Число от 0 до 5"],ans:2,hint:"randint включает оба конца диапазона"},
      {q:"__name__ == '__main__' означает?",opts:["Файл импортирован","Файл запущен напрямую","Ошибка","Класс"],ans:1,hint:"При прямом запуске __name__ = '__main__'"},
    ]},
    {id:"m09n3",kind:"lesson",title:"Создание модулей",type:"theory",content:"Любой .py файл — модуль!\n```# my_utils.py\ndef add(a, b):\n    return a + b\n\nPI = 3.14159\n\n# main.py\nimport my_utils\nprint(my_utils.add(2, 3))  # 5\nprint(my_utils.PI)         # 3.14159```"},
    {id:"m09n4",kind:"chest",title:"Сундук: Модули",bonus:35},
  ]},
  { id:"m10",title:"Генераторы",emoji:"🔄",color:"#ce82ff",xp:145,desc:"yield, comprehensions, lazy eval",nodes:[
    {id:"m10n1",kind:"lesson",title:"List Comprehension",type:"theory",content:"```# Обычный способ:\nsquares = []\nfor x in range(10):\n    squares.append(x**2)\n\n# Comprehension:\nsquares = [x**2 for x in range(10)]\n\n# С условием:\nevens = [x for x in range(20) if x%2==0]\n\n# Dict comprehension:\nd = {k: k**2 for k in range(5)}\nprint(d)  # {0:0, 1:1, 2:4, 3:9, 4:16}```"},
    {id:"m10n2",kind:"quiz",title:"Comprehensions: тест",questions:[
      {q:"[x*2 for x in range(3)] вернёт?",opts:["[0,2,4]","[1,2,3]","[2,4,6]","[0,1,2]"],ans:0,hint:"0*2=0, 1*2=2, 2*2=4"},
      {q:"[x for x in range(10) if x%2==0] даёт?",opts:["Нечётные","Чётные","Все","Квадраты"],ans:1,hint:"x%2==0 — чётные числа"},
      {q:"{k:v for k,v in [('a',1),('b',2)]} вернёт?",opts:["[('a',1)]","{'a':1,'b':2}","('a','b')","Error"],ans:1,hint:"Dict comprehension из пар"},
    ]},
    {id:"m10n3",kind:"lesson",title:"Генераторы (yield)",type:"theory",content:"```def count_up(n):\n    for i in range(n):\n        yield i\n\ngen = count_up(3)\nprint(next(gen))  # 0\nprint(next(gen))  # 1\n\nfor x in count_up(5):\n    print(x, end=' ')  # 0 1 2 3 4```\nГенератор вычисляет значения лениво — по запросу, экономит память."},
    {id:"m10n4",kind:"quiz",title:"Генераторы: тест",questions:[
      {q:"Ключевое слово для генератора?",opts:["return","yield","generate","produce"],ans:1,hint:"yield — как return, но функция продолжает работу"},
      {q:"Главное преимущество генераторов?",opts:["Быстрее списков","Экономия памяти","Проще синтаксис","Безопаснее"],ans:1,hint:"Генератор не хранит все значения в памяти"},
      {q:"next() делает?",opts:["Сбрасывает генератор","Получает следующий элемент","Удаляет","Создаёт список"],ans:1,hint:"next(gen) — следующее значение"},
    ]},
  ]},
  { id:"m11",title:"Декораторы",emoji:"🎁",color:"#ff9600",xp:160,desc:"Функции высшего порядка, @decorator",nodes:[
    {id:"m11n1",kind:"lesson",title:"Функции высшего порядка",type:"theory",content:"```def apply(func, value):\n    return func(value)\n\nprint(apply(str.upper, 'hello'))  # HELLO\n\nnums = [1, -2, 3, -4, 5]\npos = list(filter(lambda x: x>0, nums))\nprint(pos)  # [1, 3, 5]\n\ndoubled = list(map(lambda x: x*2, nums))\nprint(doubled)  # [2,-4,6,-8,10]```"},
    {id:"m11n2",kind:"quiz",title:"Высшего порядка: тест",questions:[
      {q:"map(func, lst) делает?",opts:["Фильтрует","Применяет func к каждому","Сортирует","Считает сумму"],ans:1,hint:"map применяет функцию к каждому элементу"},
      {q:"filter(lambda x: x>0, [-1,2,-3,4]) вернёт?",opts:["[-1,-3]","[2,4]","[-1,2,-3,4]","Error"],ans:1,hint:"filter оставляет элементы, где условие True"},
    ]},
    {id:"m11n3",kind:"lesson",title:"Декораторы",type:"theory",content:"```def timer(func):\n    def wrapper(*args):\n        import time\n        start = time.time()\n        result = func(*args)\n        print(f'Время: {time.time()-start:.4f}с')\n        return result\n    return wrapper\n\n@timer\ndef slow_sum(n):\n    return sum(range(n))\n\nslow_sum(1_000_000)  # Время: 0.03с```"},
    {id:"m11n4",kind:"quiz",title:"Декораторы: тест",questions:[
      {q:"@decorator — это синтаксический сахар для?",opts:["class=decorator(class)","f=decorator(f)","import decorator","decorator=f"],ans:1,hint:"@deco над def f — то же что f = deco(f)"},
      {q:"Что вернёт декоратор?",opts:["None","Новую функцию","Строку","Класс"],ans:1,hint:"Декоратор — функция, возвращающая функцию"},
      {q:"Зачем *args в wrapper?",opts:["Для скорости","Принять любые аргументы","Обязательный параметр","Не нужен"],ans:1,hint:"*args — любое количество позиционных аргументов"},
      {q:"functools.wraps нужен для?",opts:["Ускорения","Сохранения метаданных функции","Создания класса","Отладки"],ans:1,hint:"wraps сохраняет __name__ и __doc__"},
    ]},
  ]},
  { id:"m12",title:"Финальный проект",emoji:"🏆",color:"#fbbf24",xp:200,desc:"Применяем всё вместе: паттерны, async",nodes:[
    {id:"m12n1",kind:"lesson",title:"Паттерн Singleton",type:"theory",content:"```class Singleton:\n    _instance = None\n\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance\n\na = Singleton()\nb = Singleton()\nprint(a is b)  # True — один объект```\nГарантирует единственный экземпляр класса."},
    {id:"m12n2",kind:"quiz",title:"Паттерны: тест",questions:[
      {q:"Singleton обеспечивает?",opts:["Много экземпляров","Один экземпляр","Наследование","Многопоточность"],ans:1,hint:"Singleton = только один объект класса"},
      {q:"__new__ вызывается?",opts:["После __init__","До __init__","Вместо __init__","Никогда"],ans:1,hint:"__new__ создаёт объект, потом __init__ инициализирует"},
      {q:"@property позволяет?",opts:["Создавать классы","Обращаться к методу как к атрибуту","Импортировать","Декорировать"],ans:1,hint:"@property — метод без скобок при вызове"},
    ]},
    {id:"m12n3",kind:"lesson",title:"Async / Await",type:"theory",content:"```import asyncio\n\nasync def fetch(url):\n    print(f'Загружаем {url}')\n    await asyncio.sleep(1)\n    return f'Данные из {url}'\n\nasync def main():\n    results = await asyncio.gather(\n        fetch('site1.com'),\n        fetch('site2.com'),\n        fetch('site3.com'),\n    )\n    print(results)\n\nasyncio.run(main())\n# Все три — параллельно!```"},
    {id:"m12n4",kind:"quiz",title:"Async: тест",questions:[
      {q:"async def определяет?",opts:["Обычную функцию","Корутину","Класс","Генератор"],ans:1,hint:"async def — асинхронная функция (корутина)"},
      {q:"await можно использовать только?",opts:["Везде","Внутри async def","В классе","В цикле"],ans:1,hint:"await доступен только внутри async функции"},
      {q:"asyncio.gather() делает?",opts:["Последовательный запуск","Параллельный запуск корутин","Сбор ошибок","Логирование"],ans:1,hint:"gather запускает несколько корутин параллельно"},
    ]},
    {id:"m12n5",kind:"lesson",title:"Контекстные менеджеры",type:"theory",content:"```class Timer:\n    def __enter__(self):\n        import time\n        self.start = time.time()\n        return self\n\n    def __exit__(self, *args):\n        elapsed = time.time() - self.start\n        print(f'Прошло: {elapsed:.4f}с')\n\nwith Timer() as t:\n    result = sum(range(1_000_000))\n# Прошло: 0.028с```"},
    {id:"m12n6",kind:"quiz",title:"Финальный тест",questions:[
      {q:"__enter__ вызывается?",opts:["После with","В начале with","После __exit__","Вручную"],ans:1,hint:"__enter__ — вход в блок with"},
      {q:"ABC в Python — это?",opts:["Алфавит","Abstract Base Class","Алгоритм","Нет такого"],ans:1,hint:"abc.ABC — базовый класс для абстрактных классов"},
      {q:"Event loop в asyncio — это?",opts:["Бесконечный цикл ошибок","Планировщик корутин","Поток","Процесс"],ans:1,hint:"Event loop — сердце asyncio, управляет корутинами"},
      {q:"Сколько модулей в этом курсе?",opts:["5","8","12","50"],ans:2,hint:"Вы прошли 12 модулей Python пути!"},
    ]},
    {id:"m12n7",kind:"boss",title:"ФИНАЛЬНЫЙ БОСС 🏆"},
  ]},
];

/* ══════════════════════════════════════════════════
   РЕНДЕР ПУТИ
══════════════════════════════════════════════════ */
async function renderPath() {
    const outer   = document.getElementById('pythonRoadmap');
    const statsEl = document.getElementById('pythonPathStats');
    if (!outer) return;
    outer.innerHTML = '<div class="pp-loading">⏳ Загрузка пути...</div>';

    let userData = {};
    try { const s = await getDoc(doc(_db,"users",_user.uid)); if(s.exists()) userData=s.data(); } catch {}

    const progress = userData.pythonProgress || {};
    const totalXP  = userData.pythonXP || 0;

    renderStats(statsEl, progress, totalXP);
    outer.innerHTML = '';

    MODULES.forEach((mod, modIdx) => {
        const modDone   = mod.nodes.every(n => progress[n.id]?.done);
        const prevDone  = modIdx === 0 || MODULES[modIdx-1].nodes.every(n => progress[n.id]?.done);
        const modActive = !modDone && prevDone;
        const modLocked = !modDone && !prevDone;

        // ── Шапка модуля ──────────────────────────────────────────
        const hdr = document.createElement('div');
        hdr.className = `pp-mod-hdr ${modDone?'mh-done':modActive?'mh-active':'mh-locked'}`;
        const hcol = modDone ? '#58cc02' : modLocked ? 'var(--border3)' : mod.color;
        hdr.innerHTML = `
            <div class="pp-mod-icon" style="background:${hcol};box-shadow:0 4px 0 ${shade(hcol)}">
                ${modDone ? '✓' : mod.emoji}
            </div>
            <div class="pp-mod-meta">
                <div class="pp-mod-num">Модуль ${modIdx+1} / ${MODULES.length}</div>
                <div class="pp-mod-title">${esc(mod.title)}</div>
                <div class="pp-mod-desc">${esc(mod.desc)}</div>
            </div>
            <div class="pp-mod-xp" style="color:${hcol}">+${mod.xp} XP</div>
        `;
        outer.appendChild(hdr);

        // ── Ноды зигзагом ─────────────────────────────────────────
        mod.nodes.forEach((node, nIdx) => {
            const nodeDone = progress[node.id]?.done === true;
            const prevNodeDone = nIdx === 0
                ? prevDone
                : progress[mod.nodes[nIdx-1].id]?.done === true;
            const nodeLocked = !nodeDone && !prevNodeDone;

            // Зигзаг: чётные — слева, нечётные — справа
            const side = nIdx % 2 === 0 ? 'left' : 'right';

            const bc = nodeDone     ? '#58cc02'
                     : nodeLocked   ? 'var(--bg4)'
                     : node.kind === 'boss'  ? '#ff4b4b'
                     : node.kind === 'chest' ? '#fbbf24'
                     : mod.color;

            const icon = nodeDone     ? '✓'
                       : nodeLocked   ? '🔒'
                       : node.kind === 'boss'  ? '👾'
                       : node.kind === 'chest' ? '🎁'
                       : node.kind === 'quiz'  ? '❓'
                       : '📖';

            const stateClass = nodeDone     ? 'ns-done'
                             : nodeLocked   ? 'ns-locked'
                             : node.kind === 'boss'  ? 'ns-boss'
                             : node.kind === 'chest' ? 'ns-chest'
                             : 'ns-active';

            const row = document.createElement('div');
            row.className = `pp-row pp-row-${side}`;
            row.innerHTML = `
                <div class="pp-node-col">
                    <div class="pp-bub ${stateClass}"
                         style="--bc:${bc};--bs:${shade(bc)}"
                         data-nid="${node.id}" data-mod="${mod.id}" data-locked="${nodeLocked}">
                        <span class="pp-bub-icon">${icon}</span>
                        ${!nodeDone && !nodeLocked ? '<div class="pp-ring"></div>' : ''}
                    </div>
                    <div class="pp-node-lbl">
                        <div class="pp-node-name">${esc(node.title)}</div>
                        ${nodeDone
                            ? '<div class="pp-node-tag tag-done">★ Пройдено</div>'
                            : node.kind==='boss'
                                ? '<div class="pp-node-tag tag-boss">Испытание</div>'
                                : node.kind==='chest'
                                    ? `<div class="pp-node-tag tag-chest">+${node.bonus||30} XP</div>`
                                    : ''}
                    </div>
                </div>
            `;
            outer.appendChild(row);

            // Стрелка-коннектор (кроме последней ноды в модуле)
            if (nIdx < mod.nodes.length - 1) {
                const conn = document.createElement('div');
                conn.className = `pp-conn pp-conn-${side}`;
                conn.innerHTML = `<div class="pp-arr ${nodeDone?'arr-done':''}"></div>`;
                outer.appendChild(conn);
            }
        });

        // ── Разделитель между модулями ─────────────────────────────
        if (modIdx < MODULES.length - 1) {
            const sep = document.createElement('div');
            sep.className = 'pp-sep';
            sep.innerHTML = `<div class="pp-sep-line ${modDone?'sep-done':''}"></div>`;
            outer.appendChild(sep);
        }
    });

    // Делегирование кликов по нодам
    outer.addEventListener('click', e => {
        const bub = e.target.closest('[data-nid]');
        if (!bub) return;
        if (bub.dataset.locked === 'true') { showToast('🔒 Сначала завершите предыдущий урок!'); return; }
        const mod  = MODULES.find(m => m.id === bub.dataset.mod);
        const node = mod?.nodes.find(n => n.id === bub.dataset.nid);
        if (!mod || !node) return;
        node.kind === 'chest' ? openChest(node, progress) : openSession(mod, node, progress);
    }, { once: false });
}

function renderStats(el, progress, xp) {
    if (!el) return;
    let doneNodes = 0;
    MODULES.forEach(m => m.nodes.forEach(n => { if(progress[n.id]?.done) doneNodes++; }));
    const stage = petStage(xp);
    const col   = RCOL[stage.rarity];
    el.innerHTML = `
        <div class="pp-pill"><span>⚡</span><b>${xp}</b><span>XP</span></div>
        <div class="pp-pill"><span>✅</span><b>${doneNodes}/50</b><span>уроков</span></div>
        <div class="pp-pill"><span>${stage.emoji}</span><b style="color:${col}">${stage.name}</b></div>
    `;
}

/* ══════════════════════════════════════════════════
   СУНДУК
══════════════════════════════════════════════════ */
async function openChest(node, progress) {
    if (progress[node.id]?.done) { showToast('Сундук уже открыт!'); return; }
    await saveNodeDone(node.id);
    await giveXP(node.bonus||30, `+${node.bonus||30} XP из сундука!`);
    const ov = mkOv(`
        <div class="pp-end" style="padding:32px 24px">
            <div style="font-size:72px;animation:pp-chest-bob 1s ease-in-out infinite">🎁</div>
            <div class="pp-end-title">Сундук открыт!</div>
            <div class="pp-end-xp">+${node.bonus||30} XP</div>
            <button class="pp-cta" id="pp-chest-ok">Забрать!</button>
        </div>`);
    document.getElementById('pp-chest-ok').onclick = () => { closeOv(ov); renderPath(); };
}

/* ══════════════════════════════════════════════════
   СЕССИЯ
══════════════════════════════════════════════════ */
function openSession(mod, node, progress) {
    const ov = mkOv(`
        <div class="pp-modal">
            <div class="pp-mhd" style="--hc:${mod.color}">
                <button class="pp-x" id="pp-x">✕</button>
                <div class="pp-mttl">${mod.emoji} ${esc(node.title)}</div>
                <div class="pp-mxp">+XP</div>
            </div>
            <div class="pp-mprog"><div class="pp-mbar" id="pp-mbar"></div></div>
            <div class="pp-mbody" id="pp-mbody"></div>
        </div>`);
    document.getElementById('pp-x').onclick = () => closeOv(ov);
    ov.addEventListener('click', e => { if(e.target===ov) closeOv(ov); });

    if (node.kind==='boss') runBoss(mod, node, ov, progress);
    else if (node.type==='theory') runTheory(node, mod, ov);
    else runQuiz(node, mod, ov);
}

/* ── Теория ─────────────────────────────────────── */
function runTheory(node, mod, ov) {
    setBar(ov,0,1);
    const body = ov.querySelector('#pp-mbody');
    const fmt  = (node.content||'')
        .replace(/```([\s\S]*?)```/g, (_,c)=>`<pre class="pp-code">${esc(c.trim())}</pre>`)
        .replace(/`([^`]+)`/g, (_,c)=>`<code class="pp-ic">${esc(c)}</code>`)
        .replace(/\n/g,'<br>');
    body.innerHTML = `
        <div class="pp-theory">
            <div class="pp-th-icon">${mod.emoji}</div>
            <h2 class="pp-th-h">${esc(node.title)}</h2>
            <div class="pp-th-body">${fmt}</div>
            <button class="pp-cta" id="pp-th-ok">Понял, продолжить →</button>
        </div>`;
    document.getElementById('pp-th-ok').onclick = async () => {
        setBar(ov,1,1);
        await giveXP(5,'+5 XP');
        await saveNodeDone(node.id);
        closeOv(ov);
        setTimeout(renderPath,300);
    };
}

/* ── Квиз ───────────────────────────────────────── */
function runQuiz(node, mod, ov) {
    const qs = node.questions||[];
    let qi=0, hearts=3, xpEarned=0;

    const render = () => {
        if (qi>=qs.length) { showWin(mod,node,xpEarned,ov); return; }
        const q    = qs[qi];
        const body = ov.querySelector('#pp-mbody');
        setBar(ov, qi, qs.length);
        body.innerHTML = `
            <div class="pp-quiz">
                <div class="pp-qtop">
                    <div class="pp-hearts">${'❤️'.repeat(hearts)}${'🖤'.repeat(3-hearts)}</div>
                    <div class="pp-qnum">${qi+1} / ${qs.length}</div>
                </div>
                <div class="pp-question">${esc(q.q)}</div>
                <div class="pp-opts" id="pp-opts">
                    ${q.opts.map((o,i)=>`<button class="pp-opt" data-i="${i}">${esc(o)}</button>`).join('')}
                </div>
                <div class="pp-hint" id="pp-hint" style="display:none">💡 ${esc(q.hint||'')}</div>
                <div class="pp-qfoot" id="pp-qfoot" style="display:none">
                    <button class="pp-cta" id="pp-qnext">Продолжить</button>
                </div>
            </div>`;

        body.querySelector('#pp-opts').onclick = async e => {
            const btn = e.target.closest('.pp-opt');
            if (!btn||btn.disabled) return;
            body.querySelectorAll('.pp-opt').forEach(b=>b.disabled=true);
            const sel = +btn.dataset.i;
            if (sel===q.ans) {
                btn.classList.add('pp-ok'); xpEarned+=10;
                await giveXP(10,'+10 XP');
            } else {
                btn.classList.add('pp-err');
                body.querySelector(`.pp-opt[data-i="${q.ans}"]`).classList.add('pp-ok');
                body.querySelector('#pp-hint').style.display='block';
                hearts=Math.max(0,hearts-1);
                if (hearts===0) { setTimeout(()=>gameOver(mod,node,ov),700); return; }
            }
            body.querySelector('#pp-qfoot').style.display='flex';
            body.querySelector('#pp-qnext').onclick=()=>{ qi++; render(); };
        };
    };
    render();
}

/* ── Босс ───────────────────────────────────────── */
function runBoss(mod, node, ov) {
    setBar(ov,0,1);
    const body = ov.querySelector('#pp-mbody');
    const isFinal = node.id === 'm12n7';
    body.innerHTML = `
        <div class="pp-end" style="padding:16px 0">
            <div style="font-size:64px;animation:pp-boss-shake 1.4s ease-in-out infinite">${isFinal?'🏆':'👾'}</div>
            <div class="pp-end-title">${esc(node.title)}</div>
            <div class="pp-end-sub">Ответь на 5 вопросов из модуля без ошибок!</div>
            <div class="pp-end-sub" style="color:var(--text3);font-size:11px">2 жизни</div>
            <button class="pp-cta" id="pp-boss-go" style="${isFinal?'background:#fbbf24;border-bottom-color:#b45309':''}">
                ${isFinal ? '🏆 В бой!' : '⚔️ Начать бой'}
            </button>
        </div>`;
    document.getElementById('pp-boss-go').onclick = () => {
        let allQ = [];
        mod.nodes.forEach(n => { if(n.questions) allQ.push(...n.questions); });
        allQ = allQ.sort(()=>Math.random()-.5).slice(0,Math.min(5,allQ.length));
        let qi=0, hearts=2, xp=0;
        const bossCol = isFinal ? '#fbbf24' : '#ff4b4b';
        const renderBQ = () => {
            if (qi>=allQ.length) { showWin(mod,node,xp,ov,true); return; }
            const q    = allQ[qi];
            const body = ov.querySelector('#pp-mbody');
            setBar(ov,qi,allQ.length);
            body.innerHTML = `
                <div class="pp-quiz">
                    <div class="pp-qtop">
                        <div class="pp-hearts">${'❤️'.repeat(hearts)}${'🖤'.repeat(2-hearts)}</div>
                        <div class="pp-qnum">⚔️ ${qi+1}/${allQ.length}</div>
                    </div>
                    <div class="pp-question" style="border-left:4px solid ${bossCol}">${esc(q.q)}</div>
                    <div class="pp-opts" id="pp-opts">
                        ${q.opts.map((o,i)=>`<button class="pp-opt" data-i="${i}">${esc(o)}</button>`).join('')}
                    </div>
                    <div class="pp-hint" id="pp-hint" style="display:none">💡 ${esc(q.hint||'')}</div>
                    <div class="pp-qfoot" id="pp-qfoot" style="display:none">
                        <button class="pp-cta" id="pp-qnext"
                            style="background:${bossCol};border-bottom-color:${shade(bossCol)}">
                            Дальше ⚔️
                        </button>
                    </div>
                </div>`;
            body.querySelector('#pp-opts').onclick = async e => {
                const btn = e.target.closest('.pp-opt');
                if (!btn||btn.disabled) return;
                body.querySelectorAll('.pp-opt').forEach(b=>b.disabled=true);
                const sel = +btn.dataset.i;
                if (sel===q.ans) {
                    btn.classList.add('pp-ok'); xp+=15;
                    await giveXP(15,'⚔️ +15 XP');
                } else {
                    btn.classList.add('pp-err');
                    body.querySelector(`.pp-opt[data-i="${q.ans}"]`).classList.add('pp-ok');
                    body.querySelector('#pp-hint').style.display='block';
                    hearts--;
                    if (hearts<0) { setTimeout(()=>gameOver(mod,node,ov),700); return; }
                }
                body.querySelector('#pp-qfoot').style.display='flex';
                body.querySelector('#pp-qnext').onclick=()=>{ qi++; renderBQ(); };
            };
        };
        renderBQ();
    };
}

/* ── Проигрыш ───────────────────────────────────── */
function gameOver(mod, node, ov) {
    ov.querySelector('#pp-mbody').innerHTML = `
        <div class="pp-end">
            <div class="pp-end-icon" style="animation:pp-boss-shake .4s ease">💔</div>
            <div class="pp-end-title">Жизни закончились!</div>
            <div class="pp-end-sub">Не сдавайся — ты почти у цели!</div>
            <div class="pp-end-btns">
                <button class="pp-cta" id="pp-retry">↺ Повторить</button>
                <button class="pp-ghost" id="pp-exit2">Выйти</button>
            </div>
        </div>`;
    document.getElementById('pp-retry').onclick = () => { closeOv(ov); openSession(mod,node,{}); };
    document.getElementById('pp-exit2').onclick = () => closeOv(ov);
}

/* ── Победа ─────────────────────────────────────── */
async function showWin(mod, node, xpEarned, ov, isBoss=false) {
    setBar(ov,1,1);
    let xpBefore=0;
    try { const s=await getDoc(doc(_db,"users",_user.uid)); xpBefore=s.data()?.pythonXP||0; } catch {}
    const bonus = isBoss ? 50 : 20;
    await saveNodeDone(node.id);
    await giveXP(bonus,`+${bonus} XP бонус!`);
    let xpAfter=0;
    try { const s=await getDoc(doc(_db,"users",_user.uid)); xpAfter=s.data()?.pythonXP||0; } catch {}
    const before=petStage(xpBefore), after=petStage(xpAfter);
    const lvlUp = after.level > before.level;
    const col   = RCOL[after.rarity];
    await renderPet();

    const isFinal = node.id === 'm12n7';
    ov.querySelector('#pp-mbody').innerHTML = `
        <div class="pp-end pp-victory">
            <div class="pp-confetti">${isFinal?'🏆🎉🏆':isBoss?'🏆':'🎉'}</div>
            <div class="pp-end-title">${isFinal?'Путь пройден!'
                : lvlUp?'🔥 Уровень вверх!'
                : isBoss?'Босс повержен!'
                : 'Урок пройден!'}</div>
            ${lvlUp||isFinal ? `<div class="pp-lvlup" style="background:${col}">${after.emoji} ${esc(after.name)}</div>` : ''}
            <div class="pp-end-xp">+${xpEarned+bonus} XP заработано</div>
            <div class="pp-end-pet">
                <div style="font-size:56px;animation:pp-float 2.5s ease-in-out infinite">${after.emoji}</div>
                <div class="pp-pet-nm">${esc(after.name)}</div>
                <div class="pp-pet-rv" style="color:${col}">${after.rarity}</div>
            </div>
            <div class="pp-end-btns">
                <button class="pp-cta" id="pp-win-ok">${isFinal?'🏆 Завершить!':'Продолжить →'}</button>
            </div>
        </div>`;
    document.getElementById('pp-win-ok').onclick = () => { closeOv(ov); setTimeout(renderPath,300); };
}

/* ══════════════════════════════════════════════════
   ПИТОМЕЦ
══════════════════════════════════════════════════ */
export async function renderPet() {
    const w = document.querySelector('.pet-widget');
    if (!w||!_db||!_user) return;
    let xp=0;
    try { const s=await getDoc(doc(_db,"users",_user.uid)); xp=s.data()?.pythonXP||0; } catch {}
    const stage=petStage(xp), next=petNext(xp), pct=petPct(xp), col=RCOL[stage.rarity];
    w.innerHTML = `
        <div class="widget-title">🐍 Питомец</div>
        <div class="pet-big" style="font-size:48px;display:block;text-align:center;margin:10px 0;animation:pp-float 3s ease-in-out infinite">${stage.emoji}</div>
        <div class="pet-name" style="text-align:center;font-weight:800;margin-bottom:4px">${esc(stage.name)}</div>
        <div style="text-align:center;margin-bottom:10px">
            <span style="font-family:var(--mono);font-size:9px;color:${col};border:1px solid ${col};padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.1em">${stage.rarity} · LV.${stage.level}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:4px">
            <span>${xp} XP</span>
            <span>${next?`до LV.${next.level}: ${next.xp-xp} XP`:'✨ МАКС'}</span>
        </div>
        <div class="pet-xp-track" style="height:6px;background:var(--bg4);border-radius:99px;overflow:hidden;margin-bottom:2px">
            <div class="pet-xp-fill" style="width:${pct}%;height:100%;background:${col};border-radius:99px;transition:width .6s ease"></div>
        </div>
        <span class="pet-xp-lbl" style="font-family:var(--mono);font-size:9px;color:var(--text3);display:block;text-align:right;margin-bottom:12px">${pct}%</span>
        <button class="pet-go" id="pet-go-btn" style="width:100%;background:#58cc02;color:#fff;border:none;border-bottom:3px solid #3d8f00;padding:10px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer">
            ${xp===0?'▶ Начать обучение':'📖 Продолжить путь'}
        </button>`;
    document.getElementById('pet-go-btn')?.addEventListener('click',()=>{
        document.querySelector('.tab-btn[data-target="view-pythonway"]')?.click();
    });
}

/* ══════════════════════════════════════════════════
   УТИЛИТЫ
══════════════════════════════════════════════════ */
async function giveXP(amount, label) {
    try { await updateDoc(doc(_db,"users",_user.uid),{pythonXP:increment(amount)}); }
    catch { await setDoc(doc(_db,"users",_user.uid),{pythonXP:amount},{merge:true}); }
    popXP(label);
    await renderPet();
}

async function saveNodeDone(nodeId) {
    const data = { [`pythonProgress.${nodeId}`]: { done:true, completedAt:Date.now() } };
    try { await updateDoc(doc(_db,"users",_user.uid),data); }
    catch { await setDoc(doc(_db,"users",_user.uid),data,{merge:true}); }
}

function popXP(text) {
    const el=document.createElement('div');
    el.className='pp-xp-pop'; el.textContent=text;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('pp-xp-show'));
    setTimeout(()=>{ el.classList.remove('pp-xp-show'); setTimeout(()=>el.remove(),400); },1400);
}

function showToast(msg) {
    let t=document.getElementById('tbq-toast');
    if(!t){ t=document.createElement('div'); t.id='tbq-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show');
    clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2500);
}

function mkOv(html) {
    const ov=document.createElement('div'); ov.className='pp-ov'; ov.innerHTML=html;
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add('pp-ov-open'));
    return ov;
}
function closeOv(ov) { ov.classList.remove('pp-ov-open'); setTimeout(()=>ov.remove(),300); }
function setBar(ov,cur,tot) { const b=ov.querySelector('#pp-mbar'); if(b) b.style.width=`${Math.round((cur/tot)*100)}%`; }
function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function shade(hex) {
    if(!hex||hex.startsWith('var')) return 'rgba(0,0,0,.25)';
    try {
        let c=hex.replace('#','');
        if(c.length===3) c=c.split('').map(x=>x+x).join('');
        const r=Math.max(0,parseInt(c.slice(0,2),16)-45).toString(16).padStart(2,'0');
        const g=Math.max(0,parseInt(c.slice(2,4),16)-45).toString(16).padStart(2,'0');
        const b=Math.max(0,parseInt(c.slice(4,6),16)-45).toString(16).padStart(2,'0');
        return `#${r}${g}${b}`;
    } catch { return 'rgba(0,0,0,.25)'; }
}

/* ══════════════════════════════════════════════════
   HTML СТРАНИЦЫ
══════════════════════════════════════════════════ */
function patchPageHTML() {
    const v=document.getElementById('view-pythonway');
    if(!v) return;
    v.innerHTML=`
    <div class="pp-page">
        <div class="pp-top">
            <div>
                <h1 class="pp-h1">🐍 Python Путь</h1>
                <p class="pp-sub" id="pathDescription">12 модулей · 50 уроков · от основ до async</p>
            </div>
            <div id="pythonPathStats" class="pp-stats"></div>
        </div>
        <div id="pythonRoadmap" class="pp-outer"></div>
        <div id="pythonModulesGrid" style="display:none"></div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   СТИЛИ
══════════════════════════════════════════════════ */
function injectStyles() {
    if(document.getElementById('pp-s')) return;
    const s=document.createElement('style'); s.id='pp-s';
    s.textContent=`
/* ── СТРАНИЦА ───────────────────────────────── */
.pp-page { max-width: 480px; margin: 0 auto; padding: 32px 16px 100px; }
.pp-top  { display:flex; justify-content:space-between; align-items:flex-start;
           flex-wrap:wrap; gap:16px; margin-bottom:36px; }
.pp-h1   { font-size:24px; font-weight:900; margin-bottom:4px; }
.pp-sub  { font-family:var(--mono); font-size:12px; color:var(--text3); margin:0; }
.pp-stats{ display:flex; flex-direction:column; gap:6px; align-items:flex-end; }
.pp-pill { display:flex; align-items:center; gap:6px; background:var(--bg2);
           border:1px solid var(--border); padding:6px 12px; border-radius:99px;
           font-size:13px; white-space:nowrap; }
.pp-pill b { font-weight:900; }
.pp-outer { display:flex; flex-direction:column; }
.pp-loading { padding:60px 0; text-align:center; font-family:var(--mono);
              font-size:13px; color:var(--text3); }

/* ── ШАПКА МОДУЛЯ ───────────────────────────── */
.pp-mod-hdr {
    display:flex; align-items:center; gap:14px;
    padding:16px; border-radius:16px; margin:8px 0;
    background:var(--bg2); border:1px solid var(--border);
    transition:border-color .2s;
}
.pp-mod-hdr.mh-done   { border-color:#58cc02; background:rgba(88,204,2,.06); }
.pp-mod-hdr.mh-locked { opacity:.45; filter:grayscale(.6); }
.pp-mod-icon {
    width:52px; height:52px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; font-weight:900; color:#fff; flex-shrink:0;
}
.pp-mod-meta { flex:1; min-width:0; }
.pp-mod-num   { font-family:var(--mono); font-size:9px; color:var(--text3);
                text-transform:uppercase; letter-spacing:.08em; }
.pp-mod-title { font-size:15px; font-weight:800; }
.pp-mod-desc  { font-size:12px; color:var(--text3); margin-top:2px; }
.pp-mod-xp    { font-family:var(--mono); font-size:12px; font-weight:800; flex-shrink:0; }

/* ── НОДЫ ───────────────────────────────────── */
.pp-row { display:flex; padding:2px 0; }
.pp-row-left  { justify-content:flex-start; padding-left:32px; }
.pp-row-right { justify-content:flex-end;   padding-right:32px; }
.pp-node-col  { display:flex; flex-direction:column; align-items:center; gap:8px; width:88px; }

/* Пузырь */
.pp-bub {
    width:68px; height:68px; border-radius:50%;
    background:var(--bc,#58cc02);
    box-shadow:0 6px 0 var(--bs,rgba(0,0,0,.2));
    display:flex; align-items:center; justify-content:center;
    font-size:26px; position:relative; cursor:pointer;
    transition:transform .12s, box-shadow .12s;
    user-select:none;
}
.pp-bub.ns-active:hover  { transform:translateY(-3px); box-shadow:0 9px 0 var(--bs); }
.pp-bub.ns-active:active { transform:translateY(4px);  box-shadow:0 2px 0 var(--bs); }
.pp-bub.ns-done   { background:#58cc02; box-shadow:0 6px 0 #3d8f00;
                    color:#fff; font-size:24px; font-weight:900; }
.pp-bub.ns-locked { background:var(--bg3); box-shadow:0 6px 0 var(--border2);
                    cursor:default; filter:grayscale(.7); }
.pp-bub.ns-boss   { animation:pp-boss-pulse 2.5s ease-in-out infinite; }
.pp-bub.ns-chest  { animation:pp-chest-bob 2s ease-in-out infinite; }

.pp-bub-icon { pointer-events:none; }

/* Кольцо пульсации */
.pp-ring {
    position:absolute; inset:-8px; border-radius:50%;
    border:3px solid var(--bc,#58cc02);
    animation:pp-ring-anim 2.2s ease-in-out infinite;
}
@keyframes pp-ring-anim { 0%,100%{opacity:0;transform:scale(1)} 50%{opacity:.35;transform:scale(1.2)} }

/* Подпись */
.pp-node-lbl  { text-align:center; }
.pp-node-name { font-size:11px; font-weight:700; line-height:1.3; color:var(--text2); }
.pp-node-tag  { font-family:var(--mono); font-size:9px; font-weight:700;
                margin-top:4px; padding:2px 6px; border-radius:4px; display:inline-block; }
.tag-done  { color:#58cc02; }
.tag-boss  { color:#ff4b4b; }
.tag-chest { color:#fbbf24; }

/* Коннектор */
.pp-conn { display:flex; padding:2px 0; }
.pp-conn-left  { justify-content:flex-start; padding-left:64px; }
.pp-conn-right { justify-content:flex-end;   padding-right:64px; }
.pp-arr {
    width:20px; height:20px;
    border-right:3px solid var(--border2);
    border-bottom:3px solid var(--border2);
    border-radius:0 0 4px 0;
    transform:rotate(0deg);
}
.pp-conn-right .pp-arr {
    border-right:none;
    border-left:3px solid var(--border2);
    border-radius:0 0 0 4px;
}
.pp-arr.arr-done { border-color:#58cc02 !important; }

/* Разделитель */
.pp-sep { display:flex; justify-content:center; padding:12px 0; }
.pp-sep-line { width:3px; height:36px; background:var(--border2); border-radius:99px; }
.pp-sep-line.sep-done { background:#58cc02; }

/* ── ОВЕРЛЕЙ ────────────────────────────────── */
.pp-ov {
    position:fixed; inset:0; z-index:3000;
    background:rgba(0,0,0,.52);
    display:flex; align-items:flex-end; justify-content:center;
    opacity:0; pointer-events:none; transition:opacity .25s;
}
@media(min-width:560px){ .pp-ov{ align-items:center; } }
.pp-ov.pp-ov-open { opacity:1; pointer-events:all; }

.pp-modal {
    background:var(--bg); width:100%; max-width:540px; max-height:90vh;
    border-radius:20px 20px 0 0; display:flex; flex-direction:column;
    overflow:hidden; box-shadow:0 -8px 40px rgba(0,0,0,.2);
    transform:translateY(60px);
    transition:transform .35s cubic-bezier(.34,1.56,.64,1);
}
@media(min-width:560px){ .pp-modal{ border-radius:20px; transform:scale(.92) translateY(20px); } }
.pp-ov.pp-ov-open .pp-modal { transform:translateY(0) scale(1); }

.pp-mhd {
    display:flex; align-items:center; gap:12px; padding:14px 18px; flex-shrink:0;
    background:color-mix(in srgb,var(--hc,#58cc02) 12%,var(--bg));
    border-bottom:3px solid var(--hc,#58cc02);
}
.pp-x { background:var(--bg3); border:none; color:var(--text3);
         width:30px; height:30px; border-radius:50%; font-size:13px;
         cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pp-x:hover { background:var(--bg4); }
.pp-mttl { font-size:15px; font-weight:900; flex:1; }
.pp-mxp  { font-family:var(--mono); font-size:11px; color:#58cc02; font-weight:700; }
.pp-mprog{ height:6px; background:var(--bg3); flex-shrink:0; }
.pp-mbar { height:100%; background:#58cc02; width:0; transition:width .5s ease; border-radius:0 3px 3px 0; }
.pp-mbody{ flex:1; overflow-y:auto; padding:24px; overscroll-behavior:contain; }

/* ── ТЕОРИЯ ──────────────────────────────────── */
.pp-theory { display:flex; flex-direction:column; gap:16px; }
.pp-th-icon { font-size:40px; }
.pp-th-h    { font-size:21px; font-weight:900; margin:0; }
.pp-th-body { font-size:14px; line-height:1.75; color:var(--text2); }
.pp-code {
    background:var(--bg3); border-left:4px solid #58cc02;
    padding:14px 16px; font-family:var(--mono); font-size:12.5px;
    line-height:1.65; overflow-x:auto; border-radius:0 10px 10px 0;
    margin:8px 0; white-space:pre;
}
.pp-ic { background:var(--bg3); font-family:var(--mono); font-size:13px; padding:1px 5px; border-radius:4px; }

/* ── КВИЗ ────────────────────────────────────── */
.pp-quiz  { display:flex; flex-direction:column; gap:16px; }
.pp-qtop  { display:flex; justify-content:space-between; align-items:center; }
.pp-hearts{ font-size:18px; letter-spacing:3px; }
.pp-qnum  { font-family:var(--mono); font-size:12px; color:var(--text3); }
.pp-question {
    font-size:16px; font-weight:800; line-height:1.55; white-space:pre-line;
    padding:16px; background:var(--bg2); border-radius:14px; border:1px solid var(--border);
}
.pp-opts { display:flex; flex-direction:column; gap:10px; }
.pp-opt {
    padding:13px 16px; background:var(--bg); border:2px solid var(--border2);
    border-radius:14px; font-family:var(--font); font-size:14px; font-weight:600;
    cursor:pointer; text-align:left; transition:all .15s;
}
.pp-opt:not([disabled]):hover { border-color:#1cb0f6; background:rgba(28,176,246,.06); transform:translateY(-1px); }
.pp-opt.pp-ok  { border-color:#58cc02; background:rgba(88,204,2,.1); font-weight:700; }
.pp-opt.pp-err { border-color:#ff4b4b; background:rgba(255,75,75,.08); color:#ff4b4b; }
.pp-hint { padding:11px 14px; background:rgba(255,150,0,.1);
           border-left:4px solid #ff9600; border-radius:0 10px 10px 0;
           font-size:13px; color:var(--text2); }
.pp-qfoot { display:flex; justify-content:flex-end; }

/* ── КНОПКИ ─────────────────────────────────── */
.pp-cta {
    background:#58cc02; color:#fff; border:none;
    border-bottom:4px solid #3d8f00; padding:13px 28px;
    border-radius:14px; font-family:var(--font); font-size:15px;
    font-weight:800; cursor:pointer; letter-spacing:.02em;
    transition:filter .15s, transform .1s;
}
.pp-cta:hover  { filter:brightness(1.08); }
.pp-cta:active { transform:translateY(3px); border-bottom-width:1px; }
.pp-ghost {
    background:transparent; border:2px solid var(--border3); color:var(--text3);
    padding:12px 24px; border-radius:14px; font-family:var(--font);
    font-size:15px; font-weight:700; cursor:pointer; transition:all .15s;
}
.pp-ghost:hover { border-color:var(--text); color:var(--text); }

/* ── РЕЗУЛЬТАТЫ ─────────────────────────────── */
.pp-end { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; padding:8px 0; }
.pp-end-icon  { font-size:60px; }
.pp-confetti  { font-size:60px; animation:pp-pop .5s cubic-bezier(.34,1.56,.64,1); }
.pp-end-title { font-size:26px; font-weight:900; }
.pp-end-sub   { font-family:var(--mono); font-size:13px; color:var(--text3); }
.pp-end-xp    { font-family:var(--mono); font-size:14px; color:#58cc02; font-weight:800; }
.pp-lvlup { padding:10px 24px; border-radius:99px; color:#fff; font-size:16px; font-weight:800; animation:pp-pop .4s ease; }
.pp-end-pet {
    display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:18px 32px; background:var(--bg2); border-radius:18px; border:1px solid var(--border);
}
.pp-pet-nm { font-size:16px; font-weight:800; margin-top:4px; }
.pp-pet-rv { font-family:var(--mono); font-size:11px; text-transform:uppercase; letter-spacing:.1em; }
.pp-end-btns { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.pp-victory { }

/* ── XP ПОПАП ───────────────────────────────── */
.pp-xp-pop {
    position:fixed; right:20px; bottom:88px; z-index:9999;
    background:#58cc02; color:#fff; padding:8px 18px;
    border-radius:99px; font-family:var(--mono); font-size:13px; font-weight:800;
    pointer-events:none; transform:translateY(12px); opacity:0;
    transition:all .35s cubic-bezier(.34,1.56,.64,1);
}
.pp-xp-show { transform:translateY(0); opacity:1; }

/* ── АНИМАЦИИ ───────────────────────────────── */
@keyframes pp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes pp-pop    { 0%{transform:scale(.3)} 100%{transform:scale(1)} }
@keyframes pp-boss-pulse {
    0%,100%{ box-shadow:0 6px 0 var(--bs),0 0 0 0 rgba(255,75,75,.4); }
    50%    { box-shadow:0 6px 0 var(--bs),0 0 0 10px rgba(255,75,75,0); }
}
@keyframes pp-chest-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes pp-boss-shake { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
`;
    document.head.appendChild(s);
}