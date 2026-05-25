-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `dataCadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alergias` JSON NULL,
    `dietas` JSON NULL,
    `notificacoes` JSON NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItensPereciveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `categoria` VARCHAR(50) NULL,
    `dataCompra` DATE NOT NULL,
    `dataUso` DATE NULL,
    `dataValidade` DATE NOT NULL,
    `descricao` TEXT NULL,
    `observacoes` TEXT NULL,
    `quantidade` INTEGER NOT NULL,
    `aberto` BOOLEAN NOT NULL DEFAULT false,
    `terminado` BOOLEAN NOT NULL DEFAULT false,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Receitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `categoria` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `modoPreparo` TEXT NOT NULL,
    `nivelDificuldade` VARCHAR(20) NOT NULL,
    `tempoPreparoMin` INTEGER NULL,
    `itemId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Endereco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rua` VARCHAR(255) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `cidade` VARCHAR(255) NOT NULL,
    `estado` VARCHAR(255) NOT NULL,
    `cep` VARCHAR(20) NOT NULL,
    `usuarioId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocalDespejo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `tipoProduto` VARCHAR(100) NULL,
    `instrucoes` TEXT NULL,
    `restricoes` TEXT NULL,
    `enderecoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocalDoacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `tipoProduto` VARCHAR(100) NULL,
    `telefone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `site` VARCHAR(255) NULL,
    `horarioFuncionamento` VARCHAR(100) NULL,
    `enderecoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Doacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantidade` INTEGER NOT NULL,
    `dataDoacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NULL,
    `localDoacaoId` INTEGER NULL,
    `itemId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItensPereciveis` ADD CONSTRAINT `ItensPereciveis_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Receitas` ADD CONSTRAINT `Receitas_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItensPereciveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Endereco` ADD CONSTRAINT `Endereco_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocalDespejo` ADD CONSTRAINT `LocalDespejo_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `Endereco`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocalDoacao` ADD CONSTRAINT `LocalDoacao_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `Endereco`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_localDoacaoId_fkey` FOREIGN KEY (`localDoacaoId`) REFERENCES `LocalDoacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItensPereciveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Adiciona bairro na tabela Endereco
ALTER TABLE `Endereco`
  ADD COLUMN `bairro` VARCHAR(255) NULL AFTER `cep`;

-- Adiciona coordenadas para o mapa Leaflet
ALTER TABLE `LocalDespejo`
  ADD COLUMN `lat` DOUBLE NULL AFTER `enderecoId`,
  ADD COLUMN `lng` DOUBLE NULL AFTER `lat`;

ALTER TABLE `LocalDoacao`
  ADD COLUMN `lat` DOUBLE NULL AFTER `enderecoId`,
  ADD COLUMN `lng` DOUBLE NULL AFTER `lat`;