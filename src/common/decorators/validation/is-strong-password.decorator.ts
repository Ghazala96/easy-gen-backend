import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import * as zxcvbn from 'zxcvbn';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (typeof password !== 'string') {
      return false;
    }

    const result = zxcvbn(password);
    return result.score >= 3;
  }

  defaultMessage(): string {
    return 'Password is too weak';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint
    });
  };
}
