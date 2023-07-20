import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import { Flex, Text, BoxProps, FlexProps } from 'rebass/styled-components';
import cx from 'classnames';
import compact from 'lodash/compact';
import map from 'lodash/map';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import reduce from 'lodash/reduce';
import EditIcon from '@material-ui/icons/EditRounded';

import {
  usePopupState,
  bindHover,
  bindPopover,
} from 'material-ui-popup-state/hooks';

import Icon from './Icon';
import Popover from './Popover';
import baseTheme, { shadows } from '../../themes/baseTheme';

export const Tag = props => {
  const {
    id,
    icon,
    iconColor,
    iconLabel,
    iconPosition,
    iconFontSize,
    iconSrc,
    name,
    onClick,
    onClickIcon,
    onDoubleClick,
    variant,
    selected,
    sx = {},
    ...themeProps
  } = props;

  const isLeftIcon = iconPosition === 'left';
  const flexDirection = isLeftIcon ? 'row-reverse' : 'row';

  const iconMargins = {
    left: isLeftIcon ? 0 : 1,
    right: isLeftIcon ? 1 : 0,
  };

  const styles = {
    cursor: (onClick || onDoubleClick) ? 'pointer' : 'default',
    ...sx,
  };

  const classNames = cx({
    selected,
    'tag-text': true,
  });

  return (
    <Flex
      id={id}
      variant={`tags.${variant}`}
      onClick={onClick?.bind(null, id)}
      onDoubleClick={onDoubleClick?.bind(null, id)}
      flexDirection={flexDirection}
      sx={styles}
      {...themeProps}
    >
      <Text className={classNames} as="span">
        {name}
      </Text>

      {(icon || iconSrc) && (
        <Icon
          onClick={e => {
            e.stopPropagation();
            return onClickIcon?.call(null, id);
          }}
          tabIndex={-1}
          className="icon"
          fontSize={iconFontSize}
          mr={iconMargins.right}
          ml={iconMargins.left}
          theme={baseTheme}
          variant={onClickIcon ? 'default' : 'static'}
          color={iconColor}
          icon={icon}
          iconSrc={iconSrc}
          label={iconLabel}
        />
      )}
    </Flex>
  );
};

Tag.propTypes = {
  ...BoxProps,
  icon: PropTypes.elementType,
  iconLabel: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  iconFontSize: PropTypes.string,
  iconSrc: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact']),
};

Tag.defaultProps = {
  iconPosition: 'right',
  iconFontSize: 'inherit',
  variant: 'default',
};

export const TagList = translate()(props => {
  const {
    popupId,
    tags,
    onClickEdit,
    maxCharactersVisible,
    tagProps,
    selectedTagProps,
    t,
    ...themeProps
  } = props;

  const anchorRef = React.useRef();
  const visibleTags = [];
  const hiddenTags = [];

  if (maxCharactersVisible) {
    reduce(tags, (remainingChars, { name = '' }, i) => {
      const tagArray = (name.length <= remainingChars || i === 0) ? visibleTags : hiddenTags;
      if (tags[i]) tagArray.push(tags[i]);
      return remainingChars - name.length;
    }, maxCharactersVisible);
  } else {
    visibleTags.push(...compact(tags));
  }

  const popupState = usePopupState({
    variant: 'popover',
    popupId,
  });

  const anchorOrigin = useMemo(() => ({
    vertical: 'bottom',
    horizontal: 'left',
  }), []);

  const transformOrigin = useMemo(() => ({
    vertical: 'top',
    horizontal: 'left',
  }), []);

  const editIconFontSize = tagProps.variant === 'compact' ? '12px' : '14px';
  const popoverTriggerFontSize = tagProps.variant === 'compact' ? '10px' : '12px';
  const flexWrap = maxCharactersVisible ? 'nowrap' : 'wrap';

  const EditTagsIcon = () => (
    <Icon
      className="edit-tags-trigger"
      variant="default"
      color="text.primary"
      icon={EditIcon}
      fontWeight="medium"
      fontSize={editIconFontSize}
      label={t('Edit tags')}
      onClick={() => {
        popupState.close();
        onClickEdit();
      }}
    />
  );

  return (
    <Flex
      ref={anchorRef}
      className="tag-list"
      alignItems="center"
      flexWrap={flexWrap}
      sx={{ gap: 1 }}
      {...themeProps}
    >
      {map(visibleTags, tag => (
        <Tag
          id={tag.id}
          key={tag.id}
          name={tag.name}
          selected={tag.selected}
          {...tagProps}
          {...(tag.selected ? selectedTagProps : {})}
        />
      ))}

      {!!hiddenTags.length && (
        <React.Fragment>
          <Text
            className="tag-overflow-trigger"
            color="text.primary"
            fontWeight="medium"
            fontFamily="default"
            fontSize={popoverTriggerFontSize}
            lineHeight="normal"
            whiteSpace="nowrap"
            sx={{ cursor: 'default' }}
            {...bindHover(popupState)}
          >
            +{hiddenTags.length}
          </Text>

          <Popover
            useHoverPopover
            anchorOrigin={anchorOrigin}
            transformOrigin={transformOrigin}
            marginTop="4px"
            marginLeft={0}
            borderRadius={0}
            boxShadow={shadows.small}
            {...bindPopover(popupState)}
            anchorEl={anchorRef.current}
          >
            <Flex
              classname="tag-list-overflow"
              maxWidth="250px"
              alignItems="center"
              flexWrap="wrap"
              p={1}
              sx={{ gap: 1 }}
            >
              {map(hiddenTags, tag => (
                <Tag
                  id={tag.id}
                  key={tag.id}
                  name={tag.name}
                  {...tagProps}
                  {...(tag.selected ? selectedTagProps : {})}
                />
              ))}
            </Flex>
          </Popover>
        </React.Fragment>
      )}

      {!!onClickEdit && (
        <EditTagsIcon />
      )}
    </Flex>
  );
});

TagList.propTypes = {
  ...FlexProps,
  maxCharactersVisible: PropTypes.number,
  onClickEdit: PropTypes.func,
  tags: PropTypes.arrayOf(PropTypes.shape(pick(Tag.propTypes, ['name', 'id']))),
  tagProps: PropTypes.shape(omit(Tag.propTypes, ['name', 'id'])),
  popupId: PropTypes.string.isRequired,
};

TagList.defaultProps = {
  popupId: 'tagListOverflow',
  tagVariant: 'default',
  tags: [],
  tagProps: {},
  selectedTagProps: {},
};

export default Tag;
