import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Trophy, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sobre o Projeto Eu Sou Ninja</h1>
        <p className="text-muted-foreground">
          Conheça nossa história e missão
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <img
          src="/logo.jpg"
          alt="Eu Sou Ninja"
          className="h-48 w-auto rounded-lg shadow-lg"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Nossa Missão
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            O Projeto <strong>Eu Sou Ninja</strong> é uma iniciativa social dedicada ao ensino da capoeira
            como ferramenta de transformação social, desenvolvimento pessoal e resgate da cultura brasileira.
            Filiado ao grupo internacional <strong>Abadá Capoeira</strong>, trabalhamos com crianças, adolescentes
            e adultos, promovendo valores como disciplina, respeito, cidadania e identidade cultural.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Desenvolvimento Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Utilizamos a capoeira como instrumento de integração social, trabalhando com todas as
              classes e possibilitando a recuperação da noção de cidadania através da cultura afro-brasileira.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Formação Integral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Desenvolvemos competências naturais como força, equilíbrio, velocidade, agilidade, ritmo,
              coordenação e cognição através de uma metodologia técnico-pedagógica reconhecida.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Cultura Brasileira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Preservamos e difundimos a capoeira como patrimônio cultural brasileiro, conectando
              nossos alunos com suas raízes e fortalecendo sua identidade cultural.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sobre a Capoeira</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none space-y-4">
          <p>
            A Capoeira é uma luta afro-brasileira, criada no Brasil por escravos oriundos de várias
            partes da África, movidos pela ânsia de liberdade. Sendo a única luta genuinamente brasileira,
            traz consigo um caráter cultural de dimensões e valores incalculáveis.
          </p>
          <p>
            Através de expressões que transitam desde o lúdico, que promovem a orientação e o
            fortalecimento do caráter infantil, passando pela exigência do intelecto e do físico através da
            sua expressão de luta, dança, música e ritmo, a Capoeira é uma arte encantadora e de
            reconhecida eficácia quando usada para resgatar uma identidade cidadã e cultural.
          </p>
          <p>
            Em 2014, a UNESCO (Organização das Nações Unidas para Educação, Ciência e Cultura)
            declarou a roda de capoeira como <strong>Patrimônio Cultural Imaterial da Humanidade</strong>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abadá Capoeira</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none space-y-4">
          <p>
            A <strong>Abadá-Capoeira</strong> (Associação Brasileira de Apoio e Desenvolvimento da Arte Capoeira)
            é uma entidade sem fins lucrativos que tem como objetivo a difusão da cultura brasileira através
            da Capoeira. É a única escola de capoeira reconhecida pelo Ministério da Educação e Cultura (MEC)
            como escola de ensino inovadora e criativa.
          </p>
          <p>
            Atualmente é uma das maiores divulgadoras da cultura brasileira, tanto no Brasil como no
            exterior, realizando cursos, seminários, palestras e projetos. Tem representações efetivas em
            todos os estados brasileiros e mais de 60 países, com cerca de 70 mil associados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos e Metas</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <ul className="list-disc pl-6 space-y-2">
            <li>Desenvolver o estímulo do aprendizado, a cultura e a cidadania através da capoeira</li>
            <li>Potencializar as competências naturais de cada indivíduo</li>
            <li>Oferecer aprendizado de movimentos básicos, ritmos e fundamentos da Capoeira</li>
            <li>Promover oficinas culturais, palestras e cursos técnicos e teóricos</li>
            <li>Trabalhar temas transversais ligados à educação, ecologia e saúde</li>
            <li>Valorizar e preservar as tradições ligadas à cultura afro-brasileira</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <blockquote className="text-center italic text-lg">
            <p className="mb-4">
              "Preservar nossa cultura é simplesmente assegurar aos nossos descendentes
              a oportunidade de conhecer suas raízes."
            </p>
            <footer className="text-sm font-semibold text-primary">
              — Capoeira: Patrimônio Cultural Brasileiro
            </footer>
          </blockquote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> projetoeusouninja@gmail.com
            </p>
            <p>
              <strong>Telefone:</strong> (027) 98151-3137
            </p>
            <p>
              <strong>Fundador:</strong> Alexandre Xavier de Lima
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Graduado em Capoeira pela Associação Brasileira de Apoio e Desenvolvimento da Arte Capoeira (ABADÁ-CAPOEIRA)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

