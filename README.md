# Sistema de Capoeira - Eu Sou Ninja

Sistema de controle de presença para o projeto social de capoeira "Eu Sou Ninja" da Arena Jacaraípe.

## Características

- **Gestão de Alunos**: Cadastro completo com dados pessoais e responsáveis para menores
- **Controle de Turmas**: Criação e gerenciamento de turmas com horários e instrutores
- **Registro de Presença**: Sistema eficiente para marcar presença dos alunos
- **Relatórios**: Estatísticas de frequência individual e geral
- **Autenticação**: Sistema seguro de login com controle de acesso
- **Interface Responsiva**: Design moderno que funciona em dispositivos móveis

## Tecnologias Utilizadas

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Autenticação**: Flask-Login
- **ORM**: SQLAlchemy

## Instalação

### Pré-requisitos

- Python 3.8+
- pip (gerenciador de pacotes Python)

### Passos para Instalação

1. **Clone ou baixe o projeto**
   ```bash
   git clone <url-do-repositorio>
   cd eu_sou_ninja_fixed
   ```

2. **Crie um ambiente virtual (recomendado)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate  # Windows
   ```

3. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute a aplicação**
   ```bash
   python main.py
   ```

5. **Acesse o sistema**
   - Abra o navegador e vá para: `http://localhost:5000`
   - **Usuário padrão**: `admin`
   - **Senha padrão**: `admin123`

## Estrutura do Projeto

```
eu_sou_ninja_fixed/
├── main.py                 # Arquivo principal da aplicação
├── requirements.txt        # Dependências Python
├── Procfile               # Configuração para deploy (Heroku)
├── README.md              # Este arquivo
├── models/                # Modelos de dados
│   ├── __init__.py
│   ├── user.py           # Modelo de usuários
│   ├── student.py        # Modelo de alunos
│   ├── class_model.py    # Modelo de turmas
│   └── attendance.py     # Modelo de presença
├── routes/               # Rotas da API
│   ├── __init__.py
│   ├── auth.py          # Autenticação
│   ├── user.py          # Gestão de usuários
│   ├── student.py       # Gestão de alunos
│   ├── class_routes.py  # Gestão de turmas
│   ├── attendance.py    # Controle de presença
│   └── reports.py       # Relatórios
└── static/              # Arquivos estáticos
    ├── index.html       # Interface principal
    └── app.js          # Lógica JavaScript
```

## Funcionalidades

### 1. Gestão de Alunos
- Cadastro com dados pessoais completos
- Suporte para menores de idade com dados do responsável
- Controle de níveis de corda (graduação)
- Histórico de matrículas

### 2. Gestão de Turmas
- Criação de turmas com horários específicos
- Definição de instrutores e locais
- Controle de capacidade máxima
- Associação de alunos às turmas

### 3. Controle de Presença
- Registro rápido de presença por turma e data
- Visualização histórica de presenças
- Observações por aluno
- Relatórios de frequência

### 4. Relatórios e Estatísticas
- Relatórios individuais de frequência
- Estatísticas gerais do projeto
- Distribuição por faixa etária
- Análise de frequência por período

### 5. Sistema de Autenticação
- Login seguro com controle de sessão
- Proteção contra ataques de força bruta
- Diferentes níveis de acesso
- Alteração de senhas

## Configuração para Produção

### Variáveis de Ambiente

Para produção, configure as seguintes variáveis de ambiente:

```bash
export SECRET_KEY="sua-chave-secreta-aqui"
export DATABASE_URL="postgresql://usuario:senha@host:porta/database"
export FLASK_ENV="production"
```

### Deploy no Heroku

1. **Instale o Heroku CLI**
2. **Faça login no Heroku**
   ```bash
   heroku login
   ```

3. **Crie uma aplicação**
   ```bash
   heroku create nome-da-sua-app
   ```

4. **Configure o banco de dados**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

5. **Configure as variáveis de ambiente**
   ```bash
   heroku config:set SECRET_KEY="sua-chave-secreta"
   ```

6. **Faça o deploy**
   ```bash
   git add .
   git commit -m "Deploy inicial"
   git push heroku main
   ```

## Uso do Sistema

### Primeiro Acesso
1. Acesse o sistema com as credenciais padrão
2. Altere a senha do administrador
3. Crie usuários adicionais se necessário

### Cadastro de Alunos
1. Vá para a seção "Alunos"
2. Clique em "Novo Aluno"
3. Preencha os dados obrigatórios
4. Para menores de idade, preencha os dados do responsável

### Criação de Turmas
1. Vá para a seção "Turmas"
2. Clique em "Nova Turma"
3. Defina horários, instrutor e capacidade
4. Associe alunos à turma

### Controle de Presença
1. Vá para a seção "Presença"
2. Selecione a turma e data
3. Marque a presença dos alunos
4. Adicione observações se necessário
5. Salve as informações

## Suporte e Contribuição

Este sistema foi desenvolvido especificamente para o projeto social "Eu Sou Ninja" da Arena Jacaraípe. Para suporte técnico ou sugestões de melhorias, entre em contato com a equipe de desenvolvimento.

## Licença

Este projeto é de uso interno do projeto social "Eu Sou Ninja" e não possui licença de distribuição pública.
