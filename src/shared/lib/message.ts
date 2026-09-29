import React from 'react';
import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

type AppContextType = ReturnType<typeof App.useApp>;

let messageInstance: AppContextType['message'] | null = null;
let modalInstance: AppContextType['modal'] | null = null;
let notificationInstance: AppContextType['notification'] | null = null;

export const AppContextListener: React.FC = () => {
  const { message, modal, notification } = App.useApp();
  messageInstance = message;
  modalInstance = modal;
  notificationInstance = notification;
  return null;
};

export const message = {
  success: (content: any, duration?: number) => {
    if (messageInstance) {
      return messageInstance.success(content, duration);
    }
  },
  error: (content: any, duration?: number) => {
    if (messageInstance) {
      return messageInstance.error(content, duration);
    }
  },
  info: (content: any, duration?: number) => {
    if (messageInstance) {
      return messageInstance.info(content, duration);
    }
  },
  warning: (content: any, duration?: number) => {
    if (messageInstance) {
      return messageInstance.warning(content, duration);
    }
  },
  loading: (content: any, duration?: number) => {
    if (messageInstance) {
      return messageInstance.loading(content, duration);
    }
    return () => {};
  },
};

export const modal = {
  confirm: (props: any) => {
    if (modalInstance) {
      return modalInstance.confirm(props);
    }
  },
  info: (props: any) => {
    if (modalInstance) {
      return modalInstance.info(props);
    }
  },
  success: (props: any) => {
    if (modalInstance) {
      return modalInstance.success(props);
    }
  },
  error: (props: any) => {
    if (modalInstance) {
      return modalInstance.error(props);
    }
  },
  warning: (props: any) => {
    if (modalInstance) {
      return modalInstance.warning(props);
    }
  },
};
