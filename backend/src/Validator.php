<?php

declare(strict_types=1);

namespace TCH;

/**
 * Validateur leger base sur des regles textuelles.
 * Exemple de regles : 'required', 'email', 'min:3', 'max:255', 'url', 'in:a,b'.
 */
final class Validator
{
    private array $errors = [];

    public function __construct(private array $data) {}

    public static function make(array $data): self
    {
        return new self($data);
    }

    public function validate(array $rules): self
    {
        foreach ($rules as $field => $ruleString) {
            $value = $this->data[$field] ?? null;
            $ruleList = is_array($ruleString) ? $ruleString : explode('|', $ruleString);

            foreach ($ruleList as $rule) {
                [$name, $param] = array_pad(explode(':', $rule, 2), 2, null);
                $this->applyRule($field, $value, $name, $param);
            }
        }
        return $this;
    }

    private function applyRule(string $field, $value, string $rule, ?string $param): void
    {
        $isEmpty = $value === null || $value === '';

        switch ($rule) {
            case 'required':
                if ($isEmpty) {
                    $this->addError($field, "Le champ '$field' est obligatoire.");
                }
                break;
            case 'email':
                if (!$isEmpty && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "Le champ '$field' doit etre un email valide.");
                }
                break;
            case 'url':
                if (!$isEmpty && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->addError($field, "Le champ '$field' doit etre une URL valide.");
                }
                break;
            case 'min':
                if (!$isEmpty && mb_strlen((string) $value) < (int) $param) {
                    $this->addError($field, "Le champ '$field' doit contenir au moins $param caracteres.");
                }
                break;
            case 'max':
                if (!$isEmpty && mb_strlen((string) $value) > (int) $param) {
                    $this->addError($field, "Le champ '$field' ne doit pas depasser $param caracteres.");
                }
                break;
            case 'in':
                $allowed = explode(',', (string) $param);
                if (!$isEmpty && !in_array((string) $value, $allowed, true)) {
                    $this->addError($field, "Le champ '$field' est invalide.");
                }
                break;
            case 'array':
                if (!$isEmpty && !is_array($value)) {
                    $this->addError($field, "Le champ '$field' doit etre une liste.");
                }
                break;
            case 'same':
                $other = $this->data[(string) $param] ?? null;
                if (!$isEmpty && (string) $value !== (string) $other) {
                    $this->addError($field, 'Les mots de passe ne correspondent pas.');
                }
                break;
        }
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Repond 422 si la validation echoue.
     */
    public function abortIfFails(): void
    {
        if ($this->fails()) {
            Response::error('Donnees invalides.', 422, $this->errors);
        }
    }
}
